const axios = require('axios');
const { connectRabbitMQ } = require('../config/rabbitmq');
const { EXCHANGES, QUEUE, SYNC_CONFIG } = require('../utils/constant');
const syncService = require('../modules/sync/service');
const authService = require('../modules/auth/service');
const invoiceSalesOrderService = require('../modules/invoice_sales_order/service');
const { dbNetsuite } = require('../config/database');

const methodExecution = async (payload, channel, msg) => {
  const { sync_id, module: moduleName, user } = payload;

  try {
    console.info(`[Worker] Starting sync for module: ${moduleName} (Sync ID: ${sync_id})`);

    const config = SYNC_CONFIG[moduleName];
    if (!config) {
      console.error(`[Worker] No configuration found for module: ${moduleName}`);
      return channel.ack(msg);
    }

    // Get auth token from bridge
    const tokenResponse = await authService.getToken();
    const token = tokenResponse?.data?.access_token;

    if (!token) {
      throw new Error('Failed to retrieve bridge auth token');
    }

    // Hit Bridge API
    const response = await axios.post(config.url, config.data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      timeout: 120000
    });

    if (response.data) {
      if (moduleName === 'invoice_sales_orders') {
        const records = response.data?.data || [];
        if (records.length > 0) {
          try {
            console.info(`[Worker] Running specific sync to fakturs for module: ${moduleName}`);
            await invoiceSalesOrderService.processFakturSync(records);
          } catch (fakturErr) {
            console.error(`[Worker] Error syncing faktur for ${moduleName}:`, fakturErr.message);
          }
        }
      }

      // Hitung total data di database lokal
      let countData = 0;
      if (config.table) {
        try {
          const query = dbNetsuite(config.table);
          if (config.deleteCol) {
            const countResult = await query.where(config.deleteCol, false).count('* as total').first();
            countData = parseInt(countResult?.total || 0);
          } else {
            const countResult = await query.count('* as total').first();
            countData = parseInt(countResult?.total || 0);
          }
        } catch (countErr) {
          console.warn(`[Worker] Failed to count data for table ${config.table}:`, countErr.message);
        }
      }

      await syncService.updateSync(sync_id, { sync_status: 'success', count_data: countData }, user);
      console.info(`[Worker] Sync module ${moduleName} completed successfully with ${countData} records`);
    } else {
      throw new Error(response.data?.message || 'Bridge API returned failure');
    }

    channel.ack(msg);
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || String(error);
    console.error(`[Worker] Error syncing module ${moduleName}:`, errorMessage);

    try {
      // Update status to failed
      await syncService.updateSync(sync_id, { sync_status: 'failed' }, user);
    } catch (updateErr) {
      console.error(`[Worker] Failed to update sync status for ${sync_id}:`, updateErr.message);
    }

    // Ack the message so it doesn't loop, but we mark it failed in DB
    channel.ack(msg);
  }
};

const initSyncModuleServices = async () => {
  if (process.env.RABBITMQ_ENABLED !== 'true') return;

  const exchangeName = EXCHANGES.SYNC_MODULE;
  const queueName = QUEUE.SYNC_MODULE;

  try {
    const { channel, connection } = await connectRabbitMQ();

    process.once('SIGINT', async () => {
      await channel.close();
      await connection.close();
    });

    await channel.assertExchange(exchangeName, 'fanout', { durable: true });
    await channel.assertQueue(queueName, { durable: true });
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

    console.info(`[Worker] Sync Module listener initialized on queue: ${queueName}`);
  } catch (error) {
    console.error('[Worker] Failed to initialize Sync Module listener:', error);
  }
};

module.exports = {
  initSyncModuleServices
};
