const axios = require('axios');
const { connectRabbitMQ, publishToRabbitMqQueueSingle } = require('../config/rabbitmq');
const { EXCHANGES, QUEUE, SYNC_SEQUENCE, SYNC_CONFIG } = require('../utils/constant');
const syncService = require('../modules/sync/service');
const authService = require('../modules/auth/service');
const { dbNetsuite } = require('../config/database');
const repository = require('../modules/sync/repository');

const getNextModule = (currentModule) => {
  const index = SYNC_SEQUENCE.indexOf(currentModule);
  if (index !== -1 && index < SYNC_SEQUENCE.length - 1) {
    return SYNC_SEQUENCE[index + 1];
  }
  return null;
};

const methodExecution = async (payload, channel, msg) => {
  const { module: moduleName, isAuto, retryCount = 0, user } = payload;

  try {
    console.info(`[Orchestrator] Starting sync for module: ${moduleName} (Auto: ${isAuto})`);

    const config = SYNC_CONFIG[moduleName];
    if (!config) {
      console.error(`[Orchestrator] No configuration found for module: ${moduleName}`);
      return channel.ack(msg);
    }

    const userId = user?.employee_id || user?.user_id || user?.sub || null;

    // 1. Prepare Sync Record (Idempotent logic from syncService.syncModules)
    let sync_id;
    const existingSync = await repository.findByModuleAndStatus(moduleName);
    if (existingSync) {
      if (existingSync.sync_status === 'onproses') {
        console.warn(`[Orchestrator] Module ${moduleName} is already in progress. Skipping.`);
        return channel.ack(msg);
      } else {
        await repository.update(existingSync.sync_id, {
          sync_status: 'onproses',
          updated_by: userId,
          created_by: userId
        });
        sync_id = existingSync.sync_id;
      }
    } else {
      const createdSync = await repository.create({
        sync_module: moduleName,
        sync_status: 'onproses',
        created_by: userId,
        updated_by: userId
      });
      sync_id = createdSync.sync_id;
    }

    // 2. Get auth token from bridge
    const tokenResponse = await authService.getToken();
    const token = tokenResponse?.data?.access_token;
    if (!token) {
      throw new Error('Failed to retrieve bridge auth token');
    }

    // 3. Hit Bridge API
    const response = await axios.post(config.url, config.data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      timeout: 120000
    });

    if (response.data) {
      // 4. Hitung total data di database lokal
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
          console.warn(`[Orchestrator] Failed to count data for table ${config.table}:`, countErr.message);
        }
      }

      // 5. Update status to success
      await syncService.updateSync(sync_id, { sync_status: 'success', count_data: countData }, user);
      console.info(`[Orchestrator] Module ${moduleName} sync completed successfully with ${countData} records`);
      
      // 6. Determine next module and queue it
      const nextModule = getNextModule(moduleName);
      if (nextModule) {
        console.info(`[Orchestrator] Queuing next module: ${nextModule}`);
        await publishToRabbitMqQueueSingle(
          EXCHANGES.SYNC_ORCHESTRATOR,
          QUEUE.SYNC_ORCHESTRATOR,
          { module: nextModule, isAuto: true, user },
          {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': `${EXCHANGES.SYNC_ORCHESTRATOR}-dlx`
            }
          }
        );
      } else {
        console.info(`[Orchestrator] All modules in sequence completed`);
      }

      channel.ack(msg);
    } else {
      throw new Error(response.data?.message || 'Bridge API returned failure');
    }

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || String(error);
    console.error(`[Orchestrator] Error syncing module ${moduleName}:`, errorMessage);

    if (retryCount < 3) {
      console.info(`[Orchestrator] Retrying ${moduleName} (${retryCount + 1}/3)...`);
      await publishToRabbitMqQueueSingle(
        EXCHANGES.SYNC_ORCHESTRATOR,
        QUEUE.SYNC_ORCHESTRATOR,
        { ...payload, retryCount: retryCount + 1 },
        {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': `${EXCHANGES.SYNC_ORCHESTRATOR}-dlx`
          }
        }
      );
      channel.ack(msg);
    } else {
      console.error(`[Orchestrator] Max retries reached for ${moduleName}. Sending to DLQ.`);
      channel.nack(msg, false, false); 
    }
  }
};

const initSyncOrchestratorServices = async () => {
  if (process.env.RABBITMQ_ENABLED !== 'true') return;

  const exchangeName = EXCHANGES.SYNC_ORCHESTRATOR;
  const queueName = QUEUE.SYNC_ORCHESTRATOR;
  const dlxExchange = `${exchangeName}-dlx`;
  const dlqName = `${queueName}-dlq`;

  try {
    const { channel, connection } = await connectRabbitMQ();

    process.once('SIGINT', async () => {
      await channel.close();
      await connection.close();
    });

    await channel.assertExchange(dlxExchange, 'fanout', { durable: true });
    await channel.assertQueue(dlqName, { durable: true });
    await channel.bindQueue(dlqName, dlxExchange, '');

    await channel.assertExchange(exchangeName, 'fanout', { durable: true });
    await channel.assertQueue(queueName, { 
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlxExchange
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

    console.info(`[Orchestrator] Sync Orchestrator listener initialized on queue: ${queueName}`);
  } catch (error) {
    console.error('[Orchestrator] Failed to initialize Sync Orchestrator listener:', error);
  }
};

module.exports = {
  initSyncOrchestratorServices
};
