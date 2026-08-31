const { connectRabbitMQ } = require("../config/rabbitmq");
const { EXCHANGES, QUEUE } = require("../utils/constant");
const transferOrderService = require("../modules/transfer_orders/service");

/**
 * Worker logic for processing transfer order creation
 */
const methodExecution = async (payload, channel, msg) => {
  const { event_id, to_internal_id, data } = payload;

  // Guard: cek status event di DB sebelum proses
  // Jika sudah FAILED atau SUCCESS, ACK langsung (mencegah loop dari DLQ stale messages)
  try {
    const eventStatus = await transferOrderService.getEventStatus(event_id);
    if (eventStatus === "FAILED" || eventStatus === "SUCCESS") {
      console.info(
        `[Worker] TO Event ${event_id} already ${eventStatus}, skipping (ACK to clear stale DLQ message)`,
      );
      return channel.ack(msg);
    }
  } catch (guardErr) {
    console.warn(
      `[Worker] Could not check event status for ${event_id}:`,
      guardErr.message,
    );
  }

  try {
    console.info(`[Worker] Creating Transfer Order for Event ID: ${event_id}`);

    // Log start of process
    await transferOrderService.logEvent(
      event_id,
      "processing",
      "Starting request to bridge API",
      data,
    );

    // Inject internalid (UUID dari tabel transfer_orders lokal) ke payload
    // Bridge/NetSuite mengharapkan format files: [{ file_name, file_url }]
    const dataWithInternalId = {
      ...data,
      internalid: to_internal_id,
      files: (data.files || []).map((f) => ({
        file_name: f.fileName || f.file_name,
        file_url: f.fileUrl || f.file_url,
      })),
    };
    const result =
      await transferOrderService.createTransferOrderToBridge(
        dataWithInternalId,
      );

    if (
      result &&
      (result.success || result.transfer_order_id || result.to_id)
    ) {
      const netsuiteId =
        result.toId || result.transfer_order_id || result.data?.id;

      if (netsuiteId) {
        await transferOrderService.updateLocalTOId(to_internal_id, netsuiteId);
      }

      // Check if there are temporary files in the payload to finalize
      const files = data.files || [];
      if (files.length > 0) {
        const tempFile = files.find((f) => f.netsuiteId || f.netsuite_id);
        const tempNetsuiteId = tempFile
          ? tempFile.netsuiteId || tempFile.netsuite_id
          : null;
        if (tempNetsuiteId && netsuiteId) {
          console.info(
            `[Worker] Found temporary TO netsuite_id: ${tempNetsuiteId}, finalizing files to real netsuite_id: ${netsuiteId}`,
          );
          try {
            await transferOrderService.finalizeUploadedFilesForTO(
              tempNetsuiteId,
              netsuiteId,
              files,
            );
          } catch (finalizeErr) {
            console.error(
              `[Worker] Error finalizing uploaded files for TO:`,
              finalizeErr.message,
            );
          }
        }
      }

      // Update outbox event status
      await transferOrderService.updateEventStatus(event_id, "SUCCESS", result);

      // Log success
      await transferOrderService.logEvent(
        event_id,
        "success",
        "Transfer order created successfully",
        result,
      );

      // Trigger sync agar bridge melengkapi data lokal (tranid, status, dsb)
      if (netsuiteId) {
        console.info(`[Worker] Triggering sync for TO ID: ${netsuiteId}`);
        try {
          await transferOrderService.syncTransferOrderToBridge(netsuiteId);
          await transferOrderService.logEvent(
            event_id,
            "transfer_order_synced",
            "Transfer order synced successfully",
            { to_id: netsuiteId },
          );
        } catch (syncError) {
          console.error(
            `[Worker] Sync failed for TO ID ${netsuiteId}:`,
            syncError.message,
          );
          await transferOrderService.logEvent(
            event_id,
            "sync_failed",
            syncError.message,
            syncError,
          );
        }
      }
    } else {
      throw new Error(result.message || "Bridge API returned failure");
    }

    channel.ack(msg);
  } catch (error) {
    try {
      // Safely extract error details, especially from Axios errors
      const errorDetail = error.response
        ? error.response.data
        : error.errors || error;
      const errorMessage =
        error.response?.data?.message || error.message || String(error);

      console.error(
        `[Worker] Error processing TO Event ${event_id}:`,
        errorMessage,
      );

      const allowRetry = false; //jika tidak mau ada deadleatter

      if (allowRetry) {
        // Increment retry_count di DB dan nack ke DLQ
        const updated = await transferOrderService.incrementRetryCount(
          event_id,
          errorMessage,
        );
        console.info(
          `[Worker] Retrying TO Event ${event_id} (retry_count: ${updated?.retry_count}/${updated?.max_retry})`,
        );
        await transferOrderService.logEvent(
          event_id,
          "retry",
          `Retry attempt ${updated?.retry_count}: ${errorMessage}`,
          errorDetail,
        );
        channel.nack(msg, false, false); // → ke DLX → DLQ (delay 30s) → balik ke main queue
      } else {
        // retry_count sudah mencapai max_retry → FAILED, harus manual retry
        console.error(
          `[Worker] Max retries reached for TO Event ${event_id}, marking as FAILED (manual retry required)`,
        );
        await transferOrderService.updateLocalTOStatus(
          to_internal_id,
          "failed",
        );

        // Simpan request & response ke properties untuk audit
        const failureProperties = { request: data, response: errorDetail };
        await transferOrderService.updateEventStatus(
          event_id,
          "FAILED",
          errorMessage,
          failureProperties,
        );

        await transferOrderService.logEvent(
          event_id,
          "failed",
          `Max retries reached: ${errorMessage}`,
          errorDetail,
        );
        channel.ack(msg); // ACK agar tidak retry lagi di RabbitMQ
      }
    } catch (retryErr) {
      console.error(
        `[Worker] Failed to handle retry logic for TO Event ${event_id}:`,
        retryErr.message,
      );
      channel.ack(msg); // ACK untuk mencegah loop tak terbatas
    }
  }
};

const initTransferOrderServices = async () => {
  if (process.env.RABBITMQ_ENABLED !== "true") return;

  const exchangeName = EXCHANGES.TRANSFER_ORDER_CREATE;
  const queueName = QUEUE.TRANSFER_ORDER_CREATE;
  const dlxName = `${exchangeName}-retry`;
  const dlqName = `${queueName}-retry`;

  const { channel, connection } = await connectRabbitMQ();

  process.once("SIGINT", async () => {
    await channel.close();
    await connection.close();
  });

  try {
    // Setup DLX for retries
    await channel.assertExchange(dlxName, "fanout", { durable: true });
    await channel.assertQueue(dlqName, {
      durable: true,
      arguments: {
        "x-message-ttl": 5000, // 5 seconds delay before retry
        "x-dead-letter-exchange": exchangeName,
      },
    });
    await channel.bindQueue(dlqName, dlxName, "");

    // Setup Main Exchange and Queue
    await channel.assertExchange(exchangeName, "fanout", { durable: true });
    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": dlxName,
      },
    });
    await channel.bindQueue(queueName, exchangeName, "");

    await channel.prefetch(1);

    await channel.consume(
      queueName,
      async (msg) => {
        if (!msg) return;

        const payload = JSON.parse(msg.content.toString());
        await methodExecution(payload, channel, msg);
      },
      { noAck: false },
    );

    console.info(
      `[Worker] Transfer Order listener initialized on queue: ${queueName}`,
    );
  } catch (error) {
    console.error(
      "[Worker] Failed to initialize Transfer Order listener:",
      error,
    );
  }
};

module.exports = {
  initTransferOrderServices,
};
