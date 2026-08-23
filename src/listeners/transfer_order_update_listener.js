const transferOrderService = require("../modules/transfer_orders/service");
const { EXCHANGES, QUEUE } = require("../utils/constant");
const { connectRabbitMQ } = require("../config/rabbitmq");

/**
 * Worker logic for processing transfer order update
 */
const methodExecution = async (payload, channel, msg) => {
  const { event_id, to_internal_id, data } = payload;

  // Guard: cek status event di DB sebelum proses
  // Jika sudah FAILED atau SUCCESS, ACK langsung (mencegah loop dari DLQ stale messages)
  try {
    const eventStatus = await transferOrderService.getEventStatus(event_id);
    if (eventStatus === "FAILED" || eventStatus === "SUCCESS") {
      console.info(
        `[Worker] TO Update Event ${event_id} already ${eventStatus}, skipping (ACK to clear stale DLQ message)`,
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
    console.info(`[Worker] Updating Transfer Order for Event ID: ${event_id}`);

    // Log start of process
    await transferOrderService.logEvent(
      event_id,
      "processing",
      "Starting update request to bridge API",
      data,
    );
    const result = await transferOrderService.updateTransferOrderToBridge(data);

    if (result && (result.success || result.toId || result.to_id)) {
      // Update outbox event status
      await transferOrderService.updateEventStatus(event_id, "SUCCESS", result);
      await transferOrderService.logEvent(
        event_id,
        "success",
        "Transfer order updated successfully in NetSuite",
        result,
      );

      channel.ack(msg);
    } else {
      throw new Error(result?.message || "Bridge API returned failure");
    }
  } catch (error) {
    try {
      // Safely extract error details, especially from Axios errors
      const errorDetail = error.response
        ? error.response.data
        : error.errors || error;
      const errorMessage =
        error.response?.data?.message || error.message || String(error);

      console.error(
        `[Worker] Error processing TO Update Event ${event_id}:`,
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
          `[Worker] Retrying TO Update Event ${event_id} (retry_count: ${updated?.retry_count}/${updated?.max_retry})`,
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
          `[Worker] Max retries reached for TO Update Event ${event_id}, marking as FAILED (manual retry required)`,
        );
        await transferOrderService.updateLocalTOStatus(to_internal_id, "failed");

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
        `[Worker] Failed to handle retry logic for TO Update Event ${event_id}:`,
        retryErr.message,
      );
      channel.ack(msg); // ACK untuk mencegah loop tak terbatas
    }
  }
};

const initTransferOrderUpdateServices = async () => {
  if (process.env.RABBITMQ_ENABLED !== "true") return;

  const { channel, connection } = await connectRabbitMQ();

  process.once("SIGINT", async () => {
    await channel.close();
    await connection.close();
  });

  try {
    const exchangeName = EXCHANGES.TRANSFER_ORDER_UPDATE;
    const queueName = QUEUE.TRANSFER_ORDER_UPDATE;
    const dlxName = `${exchangeName}-retry`;
    const dlqName = `${queueName}-retry`;

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
        if (msg !== null) {
          const payload = JSON.parse(msg.content.toString());
          await methodExecution(payload, channel, msg);
        }
      },
      { noAck: false },
    );

    console.info(
      `[UpdateWorker] Transfer Order update listener initialized on queue: ${queueName}`,
    );
  } catch (error) {
    console.error(
      "[UpdateWorker] Failed to initialize Transfer Order update listener:",
      error,
    );
  }
};

module.exports = { initTransferOrderUpdateServices };
