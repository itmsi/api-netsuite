const axios = require('axios');
const { connectRabbitMQ } = require('../config/rabbitmq');
const { EXCHANGES, QUEUE, SYNC_CONFIG } = require('../utils/constant');
const syncService = require('../modules/sync/service');
const authService = require('../modules/auth/service');
const invoiceSalesOrderService = require('../modules/invoice_sales_order/service');
const classesService = require('../modules/classes/service');
const vendorService = require('../modules/vendor/service');
const termsService = require('../modules/terms/service');
const locationsService = require('../modules/locations/service');
const itemsService = require('../modules/items/service');
const { dbNetsuite, pgCore } = require('../config/database');

const processModuleSyncInvoiceSalesOrders = async () => {
  try {
    // 1. Cek ke DB gate_sso (pgCore) ambil max last_modified_netsuite
    const maxDateResult = await pgCore('invoice_sales_orders').max('last_modified_netsuite as max_date').first();
    const maxDate = maxDateResult?.max_date;

    const limit = 2;
    let currentPage = 1;
    let hasMoreData = true;
    let totalProcessed = 0;

    console.info(`[Worker] Starting DB Sync for invoice_sales_orders...`);

    while (hasMoreData) {
      let query = dbNetsuite('invoice_sales_orders')
        .orderBy('last_modified_netsuite', 'asc')
        .limit(limit)
        .offset((currentPage - 1) * limit);

      if (maxDate) {
        query = query.where('last_modified_netsuite', '>=', maxDate);
      }

      const records = await query;

      if (records && records.length > 0) {
        // 3. Proses sync antar DB
        await invoiceSalesOrderService.processFakturSync(records);

        totalProcessed += records.length;
        currentPage++;

        // Jika data yang didapat kurang dari limit, artinya ini halaman terakhir
        if (records.length < limit) {
          hasMoreData = false;
        }
      } else {
        hasMoreData = false;
      }
    }

    if (totalProcessed === 0) {
      console.info(`[Worker] No new data to sync for invoice_sales_orders`);
    } else {
      console.info(`[Worker] Successfully synced ${totalProcessed} records for invoice_sales_orders`);
    }
  } catch (err) {
    throw err;
  }
};

const processModuleSyncClasses = async () => {
  try {
    // 1. Cek ke DB gate_sso (pgCore) ambil max last_modified_netsuite
    const maxDateResult = await pgCore('class').max('last_modified_netsuite as max_date').first();
    const maxDate = maxDateResult?.max_date;

    const limit = 2;
    let currentPage = 1;
    let hasMoreData = true;
    let totalProcessed = 0;

    console.info(`[Worker] Starting DB Sync for class...`);

    while (hasMoreData) {
      let query = dbNetsuite('class')
        .orderBy('last_modified_netsuite', 'asc')
        .limit(limit)
        .offset((currentPage - 1) * limit);

      if (maxDate) {
        query = query.where('last_modified_netsuite', '>=', maxDate);
      }

      const records = await query;

      if (records && records.length > 0) {
        // 3. Proses sync antar DB
        await classesService.processClassSync(records);

        totalProcessed += records.length;
        currentPage++;

        // Jika data yang didapat kurang dari limit, artinya ini halaman terakhir
        if (records.length < limit) {
          hasMoreData = false;
        }
      } else {
        hasMoreData = false;
      }
    }

    if (totalProcessed === 0) {
      console.info(`[Worker] No new data to sync for classes`);
    } else {
      console.info(`[Worker] Successfully synced ${totalProcessed} records for classes`);
    }
  } catch (err) {
    throw err;
  }
};

const processModuleSyncVendors = async () => {
  try {
    // 1. Cek ke DB gate_sso (pgCore) ambil max last_modified_netsuite
    const maxDateResult = await pgCore('vendors').max('last_modified_netsuite as max_date').first();
    const maxDate = maxDateResult?.max_date;

    const limit = 2;
    let currentPage = 1;
    let hasMoreData = true;
    let totalProcessed = 0;

    console.info(`[Worker] Starting DB Sync for vendors...`);

    while (hasMoreData) {
      let query = dbNetsuite('vendors')
        .orderBy('last_modified_netsuite', 'asc')
        .limit(limit)
        .offset((currentPage - 1) * limit);

      if (maxDate) {
        query = query.where('last_modified_netsuite', '>=', maxDate);
      }

      const records = await query;

      if (records && records.length > 0) {
        // 3. Proses sync antar DB
        await vendorService.processVendorsSync(records);

        totalProcessed += records.length;
        currentPage++;

        // Jika data yang didapat kurang dari limit, artinya ini halaman terakhir
        if (records.length < limit) {
          hasMoreData = false;
        }
      } else {
        hasMoreData = false;
      }
    }

    if (totalProcessed === 0) {
      console.info(`[Worker] No new data to sync for vendors`);
    } else {
      console.info(`[Worker] Successfully synced ${totalProcessed} records for vendors`);
    }
  } catch (err) {
    throw err;
  }
};

const processModuleSyncTerms = async () => {
  try {
    // 1. Cek ke DB gate_sso (pgCore) ambil max last_modified_netsuite
    const maxDateResult = await pgCore('terms').max('last_modified_netsuite as max_date').first();
    const maxDate = maxDateResult?.max_date;

    const limit = 2;
    let currentPage = 1;
    let hasMoreData = true;
    let totalProcessed = 0;

    console.info(`[Worker] Starting DB Sync for terms...`);

    while (hasMoreData) {
      let query = dbNetsuite('terms')
        .orderBy('last_modified_netsuite', 'asc')
        .limit(limit)
        .offset((currentPage - 1) * limit);

      if (maxDate) {
        query = query.where('last_modified_netsuite', '>=', maxDate);
      }

      const records = await query;

      if (records && records.length > 0) {
        // 3. Proses sync antar DB
        await termsService.processTermsSync(records);

        totalProcessed += records.length;
        currentPage++;

        // Jika data yang didapat kurang dari limit, artinya ini halaman terakhir
        if (records.length < limit) {
          hasMoreData = false;
        }
      } else {
        hasMoreData = false;
      }
    }

    if (totalProcessed === 0) {
      console.info(`[Worker] No new data to sync for terms`);
    } else {
      console.info(`[Worker] Successfully synced ${totalProcessed} records for terms`);
    }
  } catch (err) {
    throw err;
  }
};

const processModuleSyncLocations = async () => {
  try {
    // 1. Cek ke DB gate_sso (pgCore) ambil max last_modified_netsuite
    const maxDateResult = await pgCore('locations').max('last_modified_netsuite as max_date').first();
    const maxDate = maxDateResult?.max_date;

    const limit = 2;
    let currentPage = 1;
    let hasMoreData = true;
    let totalProcessed = 0;

    console.info(`[Worker] Starting DB Sync for locations...`);

    while (hasMoreData) {
      let query = dbNetsuite('locations')
        .orderBy('last_modified_netsuite', 'asc')
        .limit(limit)
        .offset((currentPage - 1) * limit);

      if (maxDate) {
        query = query.where('last_modified_netsuite', '>=', maxDate);
      }

      const records = await query;

      if (records && records.length > 0) {
        // 3. Proses sync antar DB
        await locationsService.processLocationsSync(records);

        totalProcessed += records.length;
        currentPage++;

        // Jika data yang didapat kurang dari limit, artinya ini halaman terakhir
        if (records.length < limit) {
          hasMoreData = false;
        }
      } else {
        hasMoreData = false;
      }
    }

    if (totalProcessed === 0) {
      console.info(`[Worker] No new data to sync for terms`);
    } else {
      console.info(`[Worker] Successfully synced ${totalProcessed} records for terms`);
    }
  } catch (err) {
    throw err;
  }
};

const processModuleSyncItems = async () => {
  try {
    // 1. Cek ke DB gate_sso (pgCore) ambil max last_modified_netsuite
    const maxDateResult = await pgCore('items').max('last_modified_netsuite as max_date').first();
    const maxDate = maxDateResult?.max_date;

    const limit = 2;
    let currentPage = 1;
    let hasMoreData = true;
    let totalProcessed = 0;

    console.info(`[Worker] Starting DB Sync for items...`);

    while (hasMoreData) {
      let query = dbNetsuite('items')
        .orderBy('last_modified_netsuite', 'asc')
        .limit(limit)
        .offset((currentPage - 1) * limit);

      if (maxDate) {
        query = query.where('last_modified_netsuite', '>=', maxDate);
      }

      const records = await query;

      if (records && records.length > 0) {
        // 3. Proses sync antar DB
        await itemsService.processItemsSync(records);

        totalProcessed += records.length;
        currentPage++;

        // Jika data yang didapat kurang dari limit, artinya ini halaman terakhir
        if (records.length < limit) {
          hasMoreData = false;
        }
      } else {
        hasMoreData = false;
      }
    }

    if (totalProcessed === 0) {
      console.info(`[Worker] No new data to sync for items`);
    } else {
      console.info(`[Worker] Successfully synced ${totalProcessed} records for items`);
    }
  } catch (err) {
    throw err;
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

    const response = await axios.post(config.url, config.data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      timeout: 120000
    });

    if (!response.data || response.data.success === false) {
      throw new Error(response.data?.message || 'Bridge API returned failure');
    } else {
      if (moduleName === 'invoice_sales_orders') {
        await processModuleSyncInvoiceSalesOrders();
      }
      if (moduleName === 'classes') {
        await processModuleSyncClasses();
      }
      if (moduleName === 'vendors') {
        await processModuleSyncVendors();
      }
      if (moduleName === 'terms') {
        await processModuleSyncTerms();
      }
      if (moduleName === 'locations') {
        await processModuleSyncLocations();
      }
      if (moduleName === 'items') {
        await processModuleSyncItems();
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
