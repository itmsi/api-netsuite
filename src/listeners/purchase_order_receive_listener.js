const purchasingService = require('../modules/purchasing_orders/service');
const { EXCHANGES, QUEUE } = require('../utils/constant');

/**
 * Worker logic for processing purchase order item receipt
 */
const methodExecution = async (payload, channel, msg) => {
  const { event_id, receive_internal_id, data } = payload;

  // Guard: cek status event di DB sebelum proses
  try {
    const eventStatus = await purchasingService.getEventStatus(event_id);
    if (eventStatus === 'FAILED' || eventStatus === 'SUCCESS') {
      console.info(`[ReceiveWorker] Event ${event_id} already ${eventStatus}, skipping (ACK)`);
      return channel.ack(msg);
    }
  } catch (guardErr) {
    console.warn(`[ReceiveWorker] Could not check event status for ${event_id}:`, guardErr.message);
  }

  try {
    console.info(`[ReceiveWorker] Processing Item Receipt for Event ID: ${event_id}`);

    // Log start of process
    await purchasingService.logEvent(event_id, 'processing', 'Starting request to bridge API', data);

    const result = await purchasingService.receiveItemPurchaseOrderToBridge(data);

    if (result && result.success) {
      // Update outbox event status
      await purchasingService.updateEventStatus(event_id, 'SUCCESS', result.message || 'Item receipt successful', { request: data, response: result });
      await purchasingService.logEvent(event_id, 'success', 'Item receipt processed successfully in NetSuite', result);

      // Trigger sync logic if needed
      if (result.goods_receipts && Array.isArray(result.goods_receipts)) {
        for (const gr of result.goods_receipts) {
          if (gr.id) {
            console.info(`[ReceiveWorker] Triggering sync for Goods Receipt ID: ${gr.id}`);
            try {
              await purchasingService.syncReceiveList({
                filters: {
                  receipt_ids: [gr.id.toString()]
                }
              });
              await purchasingService.logEvent(event_id, 'sync_success', `Goods Receipt ${gr.id} synced to local DB`, { gr_id: gr.id });
            } catch (syncError) {
              console.error(`[ReceiveWorker] Sync failed for GR ${gr.id}:`, syncError.message);
              await purchasingService.logEvent(event_id, 'sync_failed', syncError.message, { gr_id: gr.id });
            }
          }
        }
      }

      channel.ack(msg);
    } else {
      throw new Error(result?.message || 'Bridge API returned failure');
    }
  } catch (error) {
    console.log('error----------------------------', JSON.stringify(error));
    const errorDetail = error.response ? error.response.data : (error.errors || error);
    const errorMessage = error.response?.data?.message || error.message || String(error);

    console.error(`[ReceiveWorker] Error processing Item Receipt Event ${event_id}:`, errorMessage);

    try {
      // Cek apakah masih bisa auto-retry
      const allowRetry = await purchasingService.canAutoRetry(event_id);

      if (allowRetry) {
        const updated = await purchasingService.incrementRetryCount(event_id, errorMessage);
        console.info(`[ReceiveWorker] Retrying Item Receipt Event ${event_id} (retry_count: ${updated?.retry_count}/${updated?.max_retry})`);
        await purchasingService.logEvent(event_id, 'retry', `Retry attempt ${updated?.retry_count}: ${errorMessage}`, errorDetail);
        channel.nack(msg, false, false); // → DLX
      } else {
        console.error(`[ReceiveWorker] Max retries reached for Item Receipt Event ${event_id}, marking as FAILED`);

        // Simpan request & response ke properties untuk audit
        const failureProperties = { request: data, response: errorDetail };
        await purchasingService.updateEventStatus(event_id, 'FAILED', errorMessage, failureProperties);

        await purchasingService.logEvent(event_id, 'failed', `Max retries reached: ${errorMessage}`, errorDetail);
        channel.ack(msg);
      }
    } catch (retryErr) {
      console.error(`[ReceiveWorker] Failed to handle retry logic:`, retryErr.message);
      channel.ack(msg);
    }
  }
};

const { connectRabbitMQ } = require('../config/rabbitmq');

const initPurchaseOrderReceiveServices = async () => {
  if (process.env.RABBITMQ_ENABLED !== 'true') return;

  const { channel, connection } = await connectRabbitMQ();

  process.once('SIGINT', async () => {
    await channel.close();
    await connection.close();
  });

  try {
    const exchangeName = EXCHANGES.PURCHASE_ORDER_RECEIVE;
    const queueName = QUEUE.PURCHASE_ORDER_RECEIVE;
    const dlxName = `${exchangeName}-retry`;
    const dlqName = `${queueName}-retry`;

    // Setup DLX
    await channel.assertExchange(dlxName, 'fanout', { durable: true });
    await channel.assertQueue(dlqName, {
      durable: true,
      arguments: {
        'x-message-ttl': 200,
        'x-dead-letter-exchange': exchangeName
      }
    });
    await channel.bindQueue(dlqName, dlxName, '');

    // Setup Main
    await channel.assertExchange(exchangeName, 'fanout', { durable: true });
    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlxName
      }
    });
    await channel.bindQueue(queueName, exchangeName, '');

    await channel.prefetch(1);

    await channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        const payload = JSON.parse(msg.content.toString());
        await methodExecution(payload, channel, msg);
      }
    }, { noAck: false });

    console.info(`[ReceiveWorker] Purchase Order receive listener initialized on queue: ${queueName}`);
  } catch (error) {
    console.error('[ReceiveWorker] Failed to initialize listener:', error);
  }
};

module.exports = { initPurchaseOrderReceiveServices };
