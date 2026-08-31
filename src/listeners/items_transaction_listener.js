const path = require("path");
const {
  connectRabbitMQ,
  publishToRabbitMqQueueSingle,
} = require("../config/rabbitmq");
const { EXCHANGES, QUEUE } = require("../utils/constant");
const itemsService = require("../modules/items/service");
const nextcloud = require("../utils/nextcloud");

/**
 * Worker logic for processing item receipt/fulfillment creation.
 * Setelah bridge API sukses, netsuite_id hasil response di-extract lalu
 * (jika ada file lampiran) di-queue ke listener attach file.
 */
const methodExecution = async (payload, channel, msg, functionType) => {
  const { transaction_type, transaction_id, items, note, noteTitle, file, userEmail } =
    payload;

  try {
    console.info(
      `[Worker] Creating item ${functionType} for transaction_id: ${transaction_id}`,
    );

    const result =
      functionType === "receipts"
        ? await itemsService.createItemReceipt({
            transaction_type,
            transaction_id,
            items,
            note,
            noteTitle,
          })
        : await itemsService.createItemFulfillment({
            transaction_type,
            transaction_id,
            items,
            note,
            noteTitle,
            ship_status: "shipped",
          });

    const netsuiteId =
      functionType === "receipts"
        ? result?.goods_receipts?.[0]?.id
        : result?.fulfillment_id;

    const documentNo =
      functionType === "receipts"
        ? result?.goods_receipts?.[0]?.tranid
        : result?.document_no;

    console.info(
      `[Worker] Item ${functionType} created, netsuite_id: ${netsuiteId}, document_no: ${documentNo}`,
    );

    let attachedFile = file;

    if (documentNo && file?.storagePath) {
      try {
        const currentDir = path.dirname(file.storagePath);
        const fileName = path.basename(file.storagePath);
        const newDir = `${currentDir}/${documentNo}`;
        const newPath = `${newDir}/${fileName}`;

        await nextcloud.ensureDirectoryExists(newDir);
        await nextcloud.moveFile(file.storagePath, newPath);

        attachedFile = { ...file, storagePath: newPath };
      } catch (moveError) {
        console.error(
          `[Worker] Failed to move file into document folder ${documentNo}:`,
          moveError.message,
        );
      }
    }

    if (netsuiteId && attachedFile) {
      const exchangeName = EXCHANGES.ITEM_ATTACH_FILE;
      const queueName = QUEUE.ITEM_ATTACH_FILE;

      await publishToRabbitMqQueueSingle(
        exchangeName,
        queueName,
        {
          netsuite_id: netsuiteId,
          type: `${transaction_type}_${functionType}`,
          file: attachedFile,
          userEmail,
        },
        {
          durable: true,
          arguments: {
            "x-dead-letter-exchange": `${exchangeName}-retry`,
          },
        },
      );
    }

    channel.ack(msg);
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || String(error);
    console.error(
      `[Worker] Error processing item ${functionType} for transaction_id ${transaction_id}:`,
      errorMessage,
    );
    // Tidak ada tabel tracking status untuk item receipt/fulfillment,
    // sehingga error cukup di-log dan message di-ack agar tidak looping.
    channel.ack(msg);
  }
};

const initQueueListener = async ({ exchangeName, queueName, functionType }) => {
  if (process.env.RABBITMQ_ENABLED !== "true") return;

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
        await methodExecution(payload, channel, msg, functionType);
      },
      { noAck: false },
    );

    console.info(
      `[Worker] Item ${functionType} listener initialized on queue: ${queueName}`,
    );
  } catch (error) {
    console.error(
      `[Worker] Failed to initialize item ${functionType} listener:`,
      error,
    );
  }
};

const initItemReceiptServices = async () =>
  initQueueListener({
    exchangeName: EXCHANGES.ITEM_RECEIPT_CREATE,
    queueName: QUEUE.ITEM_RECEIPT_CREATE,
    functionType: "receipts",
  });

const initItemFulfillmentServices = async () =>
  initQueueListener({
    exchangeName: EXCHANGES.ITEM_FULFILLMENT_CREATE,
    queueName: QUEUE.ITEM_FULFILLMENT_CREATE,
    functionType: "fulfillment",
  });

module.exports = {
  initItemReceiptServices,
  initItemFulfillmentServices,
};
