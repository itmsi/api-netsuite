const customerService = require('../modules/customer/service');
const { EXCHANGES, QUEUE } = require('../utils/constant');
const { connectRabbitMQ } = require('../config/rabbitmq');

/**
 * Worker logic for processing customer creation
 */
const methodExecution = async (payload, channel, msg) => {
  let { event_id, customer_internal_id, gate_sso_customer_internal_id, data } = payload;

  // Guard: cek status event di DB sebelum proses
  try {
    const eventStatus = await customerService.getEventStatus(event_id);
    if (eventStatus === 'FAILED' || eventStatus === 'SUCCESS') {
      console.info(`[CustomerWorker] Event ${event_id} already ${eventStatus}, skipping (ACK)`);
      return channel.ack(msg);
    }
  } catch (guardErr) {
    console.warn(`[CustomerWorker] Could not check event status for ${event_id}:`, guardErr.message);
  }

  try {
    console.info(`[CustomerWorker] Processing Customer Creation for Event ID: ${event_id}`);

    // Log start of process
    await customerService.logEvent(event_id, 'processing', 'Starting request to bridge API', data);

    // 4. listener baru insert dan hit ke netsuite seperti proses yg sudah ada
    const result = await customerService.createCustomerToBridge(data);

    if (result && result.success) {
      // 6. listener akan update ke tabel outbox_event_logs untuk status success
      await customerService.updateEventStatus(event_id, 'SUCCESS', null, { request: data, response: result });
      await customerService.logEvent(event_id, 'success', 'Customer created successfully in NetSuite', result);

      // 5. listener akan update jg tabel customers seperti proses eksisiting sekarang
      console.info(`[CustomerWorker] Updating local customer record ${customer_internal_id} with NetSuite data`);
      await customerService.updateLocalCustomer(customer_internal_id, result, gate_sso_customer_internal_id);

      channel.ack(msg);
    } else {
      throw new Error(result?.message || 'Bridge API returned failure');
    }
  } catch (error) {
    const errorDetail = error.response ? error.response.data : (error.errors || error);
    const errorMessage = error.response?.data?.message || error.message || String(error);

    console.error(`[CustomerWorker] Error processing Customer Creation Event ${event_id}:`, errorMessage);

    // 7. jangan lupa saat proses insert tidak berhasil maka listener insert ke tabel error_logs
    await customerService.insertErrorLog({
      message: errorMessage,
      stack: error.stack,
      properties: { event_id, customer_internal_id, gate_sso_customer_internal_id, data, errorDetail }
    });

    try {
      // Cek apakah masih bisa auto-retry
      const allowRetry = await customerService.canAutoRetry(event_id);

      if (allowRetry) {
        const updated = await customerService.incrementRetryCount(event_id, errorMessage);
        console.info(`[CustomerWorker] Retrying Customer Creation Event ${event_id} (retry_count: ${updated?.retry_count}/${updated?.max_retry})`);
        await customerService.logEvent(event_id, 'retry', `Retry attempt ${updated?.retry_count}: ${errorMessage}`, errorDetail);
        channel.nack(msg, false, false); // → DLX
      } else {
        console.error(`[CustomerWorker] Max retries reached for Customer Creation Event ${event_id}, marking as FAILED`);

        // Simpan request & response ke properties untuk audit
        const failureProperties = { request: data, response: errorDetail };
        await customerService.updateEventStatus(event_id, 'FAILED', errorMessage, failureProperties);

        await customerService.logEvent(event_id, 'failed', `Max retries reached: ${errorMessage}`, errorDetail);
        channel.ack(msg);
      }
    } catch (retryErr) {
      console.error(`[CustomerWorker] Failed to handle retry logic:`, retryErr.message);
      channel.ack(msg);
    }
  }
};

const initCustomerServices = async () => {
  if (process.env.RABBITMQ_ENABLED !== 'true') return;

  try {
    const { channel, connection } = await connectRabbitMQ();

    process.once('SIGINT', async () => {
      await channel.close();
      await connection.close();
    });

    const exchangeName = EXCHANGES.CUSTOMER_CREATE;
    const queueName = QUEUE.CUSTOMER_CREATE;
    const dlxName = `${exchangeName}-retry`;
    const dlqName = `${queueName}-retry`;

    // Setup DLX
    await channel.assertExchange(dlxName, 'fanout', { durable: true });
    await channel.assertQueue(dlqName, {
      durable: true,
      arguments: {
        'x-message-ttl': 5000, // 5 seconds delay before retry
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

    console.info(`[CustomerWorker] Customer creation listener initialized on queue: ${queueName}`);
  } catch (error) {
    console.error('[CustomerWorker] Failed to initialize listener:', error);
  }
};

module.exports = { initCustomerServices };
