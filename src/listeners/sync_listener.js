const axios = require('axios');
const { connectRabbitMQ } = require('../config/rabbitmq');
const { EXCHANGES, QUEUE } = require('../utils/constant');
const syncService = require('../modules/sync/service');
const authService = require('../modules/auth/service');
const { dbNetsuite } = require('../config/database');

const BRIDGE_BASE_URL = process.env.BRIDGE_BASE_URL || 'http://localhost:9570';

const SYNC_CONFIG = {
  classes: {
    url: `${BRIDGE_BASE_URL}/api/v1/bridge/class/get`,
    data: { page: 1, page_size: 50, sort_by: 'last_modified', sort_order: 'DESC', is_sync: true, filters: {} },
    table: 'class',
    deleteCol: 'is_delete'
  },
  departments: {
    url: `${BRIDGE_BASE_URL}/api/v1/bridge/department/get`,
    data: { page: 1, page_size: 50, sort_by: 'last_modified', sort_order: 'DESC', is_sync: true, filters: {} },
    table: 'departments',
    deleteCol: 'is_delete'
  },
  invoice_sales_orders: {
    url: `${BRIDGE_BASE_URL}/api/v1/bridge/invoice-sales-orders/get`,
    data: { page: 1, page_size: 20, sort_by: 'id', sort_order: 'desc', is_sync: true, filters: {} },
    table: 'invoice_sales_orders',
    deleteCol: 'is_deleted'
  },
  items: {
    url: `${BRIDGE_BASE_URL}/api/v1/bridge/items/get`,
    data: { page: 1, page_size: 50, is_sync: true },
    table: 'items',
    deleteCol: 'is_deleted'
  },
  locations: {
    url: `${BRIDGE_BASE_URL}/api/v1/bridge/locations/get`,
    data: { page: 1, page_size: 30, sort_by: 'last_modified_netsuite', sort_order: 'DESC', is_sync: true, filters: {} },
    table: 'locations',
    deleteCol: 'is_deleted'
  },
  purchasing_orders: {
    url: `${BRIDGE_BASE_URL}/api/v1/bridge/purchase-orders/get-list`,
    data: { page: 1, page_size: 1, sort_by: 'trandate', sort_order: 'DESC', is_sync: true, filters: {} },
    table: 'purchase_orders',
    deleteCol: null
  },
  sales_orders: {
    url: `${BRIDGE_BASE_URL}/api/v1/bridge/sales-orders/get`,
    data: { page: 1, page_size: 1, sort_by: 'last_modified_netsuite', sort_order: 'DESC', is_sync: true, filters: {} },
    table: 'sales_orders',
    deleteCol: 'is_deleted'
  },
  terms: {
    url: `${BRIDGE_BASE_URL}/api/v1/bridge/term/sync`,
    data: { page: 1, limit: 10, sort_by: 'name', sort_order: 'desc', is_sync: true, search: '' },
    table: 'terms',
    deleteCol: 'is_delete'
  },
  vendors: {
    url: `${BRIDGE_BASE_URL}/api/v1/bridge/vendors/get`,
    data: { page: 1, page_size: 50, is_sync: true },
    table: 'vendors',
    deleteCol: 'is_deleted'
  },
  customers: {
    url: `${BRIDGE_BASE_URL}/api/v1/bridge/customers/get`,
    data: { page: 1, page_size: 50, is_sync: true },
    table: 'customers',
    deleteCol: 'is_deleted'
  }
};

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
