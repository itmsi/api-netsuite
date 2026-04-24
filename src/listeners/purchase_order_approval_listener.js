const purchasingService = require('../modules/purchasing_orders/service');
const { EXCHANGES, QUEUE } = require('../utils/constant');
const { connectRabbitMQ } = require('../config/rabbitmq');

/**
 * Worker logic for processing purchase order approval
 */
const methodExecution = async (payload, channel, msg) => {
  const { event_id, noted_internal_id, data } = payload;

  // Guard: cek status event di DB sebelum proses
  try {
    const eventStatus = await purchasingService.getEventStatus(event_id);
    if (eventStatus === 'FAILED' || eventStatus === 'SUCCESS') {
      console.info(`[ApprovalWorker] Event ${event_id} already ${eventStatus}, skipping (ACK)`);
      return channel.ack(msg);
    }
  } catch (guardErr) {
    console.warn(`[ApprovalWorker] Could not check event status for ${event_id}:`, guardErr.message);
  }

  try {
    console.info(`[ApprovalWorker] Processing Approval for Event ID: ${event_id}`);

    // Log start of process
    await purchasingService.logEvent(event_id, 'processing', 'Starting request to bridge API', data);

    const result = await purchasingService.approvePurchaseOrderToBridge(data);

    if (result && result.success !== false) { // the api might return success: true or just result
      // Update outbox event status
      await purchasingService.updateEventStatus(event_id, 'SUCCESS', result.message || 'Approval successful', { request: data, response: result });
      await purchasingService.logEvent(event_id, 'success', 'Approval processed successfully in NetSuite', result);

      // Update purchase_order_noteds
      await purchasingService.updatePurchaseOrderNotedsStatus(noted_internal_id, 'success');

      channel.ack(msg);
    } else {
      throw new Error(result?.message || 'Bridge API returned failure');
    }
  } catch (error) {
    const errorDetail = error.response ? error.response.data : (error.errors || error);
    const errorMessage = error.response?.data?.message || error.message || String(error);

    console.error(`[ApprovalWorker] Error processing Approval Event ${event_id}:`, errorMessage);

    try {
      // Cek apakah masih bisa auto-retry
      const allowRetry = await purchasingService.canAutoRetry(event_id);

      if (allowRetry) {
        const updated = await purchasingService.incrementRetryCount(event_id, errorMessage);
        console.info(`[ApprovalWorker] Retrying Approval Event ${event_id} (retry_count: ${updated?.retry_count}/${updated?.max_retry})`);
        await purchasingService.logEvent(event_id, 'retry', `Retry attempt ${updated?.retry_count}: ${errorMessage}`, errorDetail);
        channel.nack(msg, false, false); // → DLX
      } else {
        console.error(`[ApprovalWorker] Max retries reached for Approval Event ${event_id}, marking as FAILED`);

        // Simpan request & response ke properties untuk audit
        const failureProperties = { request: data, response: errorDetail };
        await purchasingService.updateEventStatus(event_id, 'FAILED', errorMessage, failureProperties);

        // Update purchase_order_noteds
        await purchasingService.updatePurchaseOrderNotedsStatus(noted_internal_id, 'failed');

        await purchasingService.logEvent(event_id, 'failed', `Max retries reached: ${errorMessage}`, errorDetail);
        channel.ack(msg);
      }
    } catch (retryErr) {
      console.error(`[ApprovalWorker] Failed to handle retry logic:`, retryErr.message);
      channel.ack(msg);
    }
  }
};

const initPurchaseOrderApprovalServices = async () => {
  if (process.env.RABBITMQ_ENABLED !== 'true') return;

  const { channel, connection } = await connectRabbitMQ();

  process.once('SIGINT', async () => {
    await channel.close();
    await connection.close();
  });

  try {
    const exchangeName = EXCHANGES.PURCHASE_ORDER_APPROVAL;
    const queueName = QUEUE.PURCHASE_ORDER_APPROVAL;
    const dlxName = `${exchangeName}-retry`;
    const dlqName = `${queueName}-retry`;

    // Setup DLX
    await channel.assertExchange(dlxName, 'fanout', { durable: true });
    await channel.assertQueue(dlqName, {
      durable: true,
      arguments: {
        'x-message-ttl': 30000,
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

    console.info(`[ApprovalWorker] Purchase Order approval listener initialized on queue: ${queueName}`);
  } catch (error) {
    console.error('[ApprovalWorker] Failed to initialize listener:', error);
  }
};

module.exports = { initPurchaseOrderApprovalServices };
