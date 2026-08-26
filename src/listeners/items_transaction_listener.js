const {
  connectRabbitMQ,
  publishToRabbitMqQueueSingle,
} = require("../config/rabbitmq");
const { EXCHANGES, QUEUE } = require("../utils/constant");
const itemsService = require("../modules/items/service");

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

    console.info(
      `[Worker] Item ${functionType} created, netsuite_id: ${netsuiteId}`,
    );

    if (netsuiteId && file) {
      const exchangeName = EXCHANGES.ITEM_ATTACH_FILE;
      const queueName = QUEUE.ITEM_ATTACH_FILE;

      await publishToRabbitMqQueueSingle(
        exchangeName,
        queueName,
        {
          netsuite_id: netsuiteId,
          type: `${transaction_type}_${functionType}`,
          file,
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
