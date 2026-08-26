const { connectRabbitMQ } = require("../config/rabbitmq");
const { EXCHANGES, QUEUE } = require("../utils/constant");
const attachFileService = require("../modules/attach_file/service");

/**
 * Worker logic for saving file record + notifying bridge API attach_file,
 * dijalankan setelah netsuite_id item receipt/fulfillment didapat.
 */
const methodExecution = async (payload, channel, msg) => {
  const { netsuite_id, type, file, userEmail } = payload;

  try {
    console.info(
      `[Worker] Attaching file for netsuite_id: ${netsuite_id}, type: ${type}`,
    );

    const record = await attachFileService.saveFileRecord({
      transaction_type: type,
      netsuite_id,
      file_name: file.fileName,
      file_name_original: file.fileNameOriginal,
      storage_provider: "nextcloud",
      storage_path: file.storagePath,
      share_url: file.fileUrl,
      file_url: file.fileUrl,
      created_by_api: userEmail || null,
    });

    await attachFileService.callBridgeCreate({
      localId: record?.id,
      type,
      netsuiteId: netsuite_id,
      createdByApi: userEmail || null,
      files: [{ fileName: file.fileName, fileUrl: file.fileUrl }],
    });

    console.info(
      `[Worker] File attached successfully for netsuite_id: ${netsuite_id}`,
    );

    channel.ack(msg);
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || String(error);
    console.error(
      `[Worker] Error attaching file for netsuite_id ${netsuite_id}:`,
      errorMessage,
    );
    channel.ack(msg);
  }
};

const initItemAttachFileServices = async () => {
  if (process.env.RABBITMQ_ENABLED !== "true") return;

  const exchangeName = EXCHANGES.ITEM_ATTACH_FILE;
  const queueName = QUEUE.ITEM_ATTACH_FILE;
  const dlxName = `${exchangeName}-retry`;
  const dlqName = `${queueName}-retry`;

  const { channel, connection } = await connectRabbitMQ();

  process.once("SIGINT", async () => {
    await channel.close();
    await connection.close();
  });

  try {
    await channel.assertExchange(dlxName, "fanout", { durable: true });
    await channel.assertQueue(dlqName, {
      durable: true,
      arguments: {
        "x-message-ttl": 5000,
        "x-dead-letter-exchange": exchangeName,
      },
    });
    await channel.bindQueue(dlqName, dlxName, "");

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
      `[Worker] Item attach file listener initialized on queue: ${queueName}`,
    );
  } catch (error) {
    console.error(
      "[Worker] Failed to initialize item attach file listener:",
      error,
    );
  }
};

module.exports = {
  initItemAttachFileServices,
};
