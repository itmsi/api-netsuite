const purchasingService = require('../modules/purchasing_orders/service');
const { EXCHANGES, QUEUE } = require('../utils/constant');

const methodExecution = async (payload, channel, msg) => {
  const { event_id, po_internal_id, data } = payload;

  try {
    console.info(`[Worker] Updating Purchase Order for Event ID: ${event_id}`);
    
    // Log start of process
    await purchasingService.logEvent(event_id, 'processing', 'Starting update request to bridge API', data);

    const result = await purchasingService.updatePurchaseOrderToBridge(data);

    if (result && (result.success || result.poId || result.po_id)) {
      const poId = result.poId || result.po_id || (result.data && result.data.id);
      
      // Update outbox event status
      await purchasingService.updateEventStatus(event_id, 'SUCCESS', result);
      await purchasingService.logEvent(event_id, 'success', 'Purchase order updated successfully in NetSuite', result);

      if (poId) {
        console.info(`[Worker] Triggering sync for PO ID after update: ${poId}`);
        try {
          await purchasingService.syncPurchaseOrderById(poId);
          await purchasingService.logEvent(event_id, 'purchase_order_synced', 'Purchase order data synced to local DB', { po_id: poId });
        } catch (syncError) {
          console.error(`[Worker] Sync failed for PO ID ${poId}:`, syncError.message);
        }
      }

      channel.ack(msg);
    } else {
      throw new Error(result?.message || 'Failed to update PO at bridge API');
    }
  } catch (error) {
    console.error(`[Worker] Error processing PO Update Event ${event_id}:`, error.message);

    // Check retry count from RabbitMQ headers (following user's latest pattern)
    const deathHeader = msg.properties.headers && msg.properties.headers['x-death'];
    const retryCount = deathHeader ? deathHeader[0].count : 0;

    if (retryCount < 3) {
      console.info(`[Worker] Retrying PO Update Event ${event_id} (${retryCount + 1}/3)`);
      channel.nack(msg, false, false);
    } else {
      console.error(`[Worker] Max retries reached for PO Update Event ${event_id}`);

      // 7. Jika gagal (max retries), update status menjadi 'FAILED'
      await purchasingService.updateLocalPOStatus(po_internal_id, 'failed');
      await purchasingService.updateEventStatus(event_id, 'FAILED', error.message);
      await purchasingService.logEvent(event_id, 'failed', error.message, error);

      channel.ack(msg); 
    }
  }
};

const initPurchaseOrderUpdateServices = (channel) => {
  channel.assertExchange(EXCHANGES.PURCHASE_ORDER, 'direct', { durable: true });
  channel.assertQueue(QUEUE.PURCHASE_ORDER_UPDATE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': `${EXCHANGES.PURCHASE_ORDER}-retry`
    }
  });

  channel.bindQueue(QUEUE.PURCHASE_ORDER_UPDATE, EXCHANGES.PURCHASE_ORDER, QUEUE.PURCHASE_ORDER_UPDATE);

  channel.consume(QUEUE.PURCHASE_ORDER_UPDATE, async (msg) => {
    if (msg !== null) {
      const payload = JSON.parse(msg.content.toString());
      await methodExecution(payload, channel, msg);
    }
  });
};

module.exports = { initPurchaseOrderUpdateServices };
