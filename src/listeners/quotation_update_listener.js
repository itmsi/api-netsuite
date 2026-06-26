const { connectRabbitMQ } = require('../config/rabbitmq');
const { EXCHANGES, QUEUE } = require('../utils/constant');
const quotationService = require('../modules/quotation/service');

const methodExecution = async (payload, channel, msg) => {
  const { event_id, quotation_internal_id, data } = payload;

  try {
    const eventStatus = await quotationService.getEventStatus(event_id);
    if (eventStatus === 'FAILED' || eventStatus === 'SUCCESS') {
      console.info(`[Worker] Quotation Update Event ${event_id} already ${eventStatus}, skipping`);
      return channel.ack(msg);
    }
  } catch (guardErr) {
    console.warn(`[Worker] Could not check event status for ${event_id}:`, guardErr.message);
  }

  try {
    console.info(`[Worker] Updating Quotation for Event ID: ${event_id}`);
    await quotationService.logEvent(event_id, 'processing', 'Starting request to bridge API for update', data);

    const dataWithInternalId = { ...data, internalid: quotation_internal_id };
    const result = await quotationService.updateQuotationToBridge(dataWithInternalId);

    if (result && (result.status === 'error' || result.data?.status === 'error')) {
      result.success = false;
    }

    if (result && result.success) {
      await quotationService.updateEventStatus(event_id, 'SUCCESS', result);
      await quotationService.logEvent(event_id, 'success', 'Quotation updated successfully', result);

      const qId = result.quotationId || result.data?.id;
      if (qId || data.id) {
        const idToSync = qId || data.id;
        console.info(`[Worker] Triggering sync for Quotation ID: ${idToSync}`);
        try {
          await quotationService.syncQuotationById(idToSync);
          await quotationService.logEvent(event_id, 'quotation_synced', 'Quotation synced successfully', { quotationId: idToSync });
        } catch (syncError) {
          console.error(`[Worker] Sync failed for Quotation ID ${idToSync}:`, syncError.message);
          await quotationService.logEvent(event_id, 'sync_failed', syncError.message, syncError);
        }
      }
    } else {
      throw new Error(result.message || 'Bridge API returned failure');
    }

    channel.ack(msg);
  } catch (error) {
    try {
      const errorDetail = error.response ? error.response.data : (error.errors || error);
      const errorMessage = error.response?.data?.message || error.message || String(error);

      console.error(`[Worker] Error processing Quotation Update Event ${event_id}:`, errorMessage);

      const allowRetry = false; //jika tidak mau ada deadleatter
      // Cek apakah masih bisa auto-retry berdasarkan retry_count dan max_retry di DB
      // const allowRetry = await quotationService.canAutoRetry(event_id);

      if (allowRetry) {
        const updated = await quotationService.incrementRetryCount(event_id, errorMessage);
        console.info(`[Worker] Retrying Quotation Update Event ${event_id} (retry_count: ${updated?.retry_count}/${updated?.max_retry})`);
        await quotationService.logEvent(event_id, 'retry', `Retry attempt ${updated?.retry_count}: ${errorMessage}`, errorDetail);
        channel.nack(msg, false, false);
      } else {
        console.error(`[Worker] Max retries reached for Quotation Update Event ${event_id}, marking as FAILED`);
        await quotationService.updateLocalQuotationStatus(quotation_internal_id, 'failed');

        const failureProperties = { request: data, response: errorDetail };
        await quotationService.updateEventStatus(event_id, 'FAILED', errorMessage, failureProperties);

        await quotationService.logEvent(event_id, 'failed', `Max retries reached: ${errorMessage}`, errorDetail);

        // Fallback sync: Karena ini update, data sebelumnya sudah ada netsuite_id di DB lokal atau di data payload.
        let qId = null;
        try {
          const qRecord = await quotationService.getQuotationById(quotation_internal_id);
          qId = qRecord?.netsuite_id || null;
        } catch (dbErr) {
          console.warn(`[Worker] Failed to fetch quotation record for fallback:`, dbErr.message);
        }

        if (qId) {
          console.info(`[Worker] Triggering sync for Quotation ID after update failure: ${qId}`);
          try {
            await quotationService.syncQuotationById(qId);
            await quotationService.logEvent(event_id, 'quotation_synced', 'Quotation data synced to local DB after update failure', { quotationId: qId });
          } catch (syncError) {
            console.error(`[Worker] Sync failed for Quotation ID ${qId} after update failure:`, syncError.message);
            await quotationService.logEvent(event_id, 'sync_failed', syncError.message, syncError);
          }
        }

        channel.ack(msg);
      }
    } catch (retryErr) {
      console.error(`[Worker] Failed to handle retry logic for Quotation Update Event ${event_id}:`, retryErr.message);
      channel.ack(msg);
    }
  }
};

const initQuotationUpdateService = async () => {
  if (process.env.RABBITMQ_ENABLED !== 'true') return;

  const exchangeName = EXCHANGES.QUOTATION_UPDATE;
  const queueName = QUEUE.QUOTATION_UPDATE;
  const dlxName = `${exchangeName}-retry`;
  const dlqName = `${queueName}-retry`;

  const { channel, connection } = await connectRabbitMQ();

  process.once('SIGINT', async () => {
    await channel.close();
    await connection.close();
  });

  try {
    await channel.assertExchange(dlxName, 'fanout', { durable: true });
    await channel.assertQueue(dlqName, {
      durable: true,
      arguments: {
        'x-message-ttl': 5000,
        'x-dead-letter-exchange': exchangeName
      }
    });
    await channel.bindQueue(dlqName, dlxName, '');

    await channel.assertExchange(exchangeName, 'fanout', { durable: true });
    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlxName
      }
    });
    await channel.bindQueue(queueName, exchangeName, '');

    await channel.prefetch(1);

    await channel.consume(
      queueName,
      async (msg) => {
        if (!msg) return;

        const payload = JSON.parse(msg.content.toString());
        await methodExecution(payload, channel, msg);
      },
      { noAck: false }
    );

    console.info(`[Worker] Quotation Update listener initialized on queue: ${queueName}`);
  } catch (error) {
    console.error('[Worker] Failed to initialize Quotation Update listener:', error);
  }
};

module.exports = {
  initQuotationUpdateService
};
