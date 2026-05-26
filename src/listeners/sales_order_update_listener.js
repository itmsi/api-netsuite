const { connectRabbitMQ } = require('../config/rabbitmq')
const {
  EXCHANGES, QUEUE, logger, todayFormat
} = require('../utils')
const salesService = require('../modules/sales_orders/service')

/**
 * Worker logic for processing sales order update
 */
const methodExecution = async (payload, channel, msg) => {
  const { event_id, so_internal_id, data } = payload

  // Guard: cek status event di DB sebelum proses
  try {
    const eventStatus = await salesService.getEventStatus(event_id)
    if (eventStatus === 'FAILED' || eventStatus === 'SUCCESS') {
      console.info(`[Worker] SO Update Event ${event_id} already ${eventStatus}, skipping (ACK to clear stale DLQ message)`)
      return channel.ack(msg)
    }
  } catch (guardErr) {
    console.warn(`[Worker] Could not check event status for ${event_id}:`, guardErr.message)
  }

  try {
    console.info(`[Worker] Updating SO for Event ID: ${event_id}`)

    // Log start of process
    await salesService.logEvent(event_id, 'processing', 'Starting request to bridge API for update', data)

    // Inject internalid (UUID dari tabel sales_orders lokal) ke payload
    const dataWithInternalId = { ...data, internalid: so_internal_id }
    const result = await salesService.updateSalesOrderToBridge(dataWithInternalId)

    if (result && result.success) {
      // Update outbox event status
      await salesService.updateEventStatus(event_id, 'SUCCESS', result)

      // Log success
      await salesService.logEvent(event_id, 'success', 'Sales order updated successfully', result);

      // Fetch netsuite_id dari DB lokal untuk sinkronisasi
      const soRecord = await salesService.getSalesOrderById(so_internal_id);
      const netsuiteId = soRecord?.items?.[0]?.netsuite_id;

      if (netsuiteId) {
        console.info(`[Worker] Triggering sync after update for SO ID: ${netsuiteId}`);
        try {
          await salesService.syncSalesOrderByIdInternalId(netsuiteId, so_internal_id);
          await salesService.logEvent(event_id, 'sales_order_synced', 'Sales order synced successfully after update', { so_id: netsuiteId })
        } catch (syncError) {
          console.error(`[Worker] Sync failed for SO ID ${netsuiteId}:`, syncError.message)
          await salesService.logEvent(event_id, 'sync_failed', syncError.message, syncError)
        }
      }
    } else {
      throw new Error(result.message || 'Bridge API returned failure for update')
    }

    channel.ack(msg)
  } catch (error) {
    try {
      const errorDetail = error.response ? error.response.data : (error.errors || error);
      const errorMessage = error.response?.data?.message || error.message || String(error);

      console.error(`[Worker] Error processing SO Update Event ${event_id}:`, errorMessage);

      const allowRetry = false; //jika tidak mau pakek dead letter
      // const allowRetry = await salesService.canAutoRetry(event_id)

      if (allowRetry) {
        const updated = await salesService.incrementRetryCount(event_id, errorMessage)
        console.info(`[Worker] Retrying SO Update Event ${event_id} (retry_count: ${updated?.retry_count}/${updated?.max_retry})`)
        await salesService.logEvent(event_id, 'retry', `Retry attempt ${updated?.retry_count}: ${errorMessage}`, errorDetail)
        channel.nack(msg, false, false)
      } else {
        console.error(`[Worker] Max retries reached for SO Update Event ${event_id}, marking as FAILED`)

        const failureProperties = { request: data, response: errorDetail };
        await salesService.updateEventStatus(event_id, 'FAILED', errorMessage, failureProperties)

        await salesService.logEvent(event_id, 'failed', `Max retries reached: ${errorMessage}`, errorDetail)

        try {
          const soRecord = await salesService.getSalesOrderById(so_internal_id);
          const currentNetsuiteId = soRecord?.items?.[0]?.netsuite_id;

          if (currentNetsuiteId) {
            console.info(`[Worker] Triggering sync after failed update for SO netsuite id: ${currentNetsuiteId}, so internal id: ${so_internal_id}`);
            await salesService.syncSalesOrderByIdInternalId(currentNetsuiteId, so_internal_id);
            await salesService.logEvent(event_id, 'sales_order_synced', 'Sales order synced successfully after failed update', { so_id: currentNetsuiteId })
          }
        } catch (syncError) {
          console.error(`[Worker] Sync failed after max retries for SO ID ${so_internal_id}:`, syncError.message)
          await salesService.logEvent(event_id, 'sync_failed', syncError.message, syncError)
        }

        channel.ack(msg)
      }
    } catch (retryErr) {
      console.error(`[Worker] Failed to handle retry logic for SO Update Event ${event_id}:`, retryErr.message)
      channel.ack(msg)
    }
  }
}

const initSalesOrderUpdateServices = async () => {
  if (process.env.RABBITMQ_ENABLED !== 'true') return

  const exchangeName = EXCHANGES.SALES_ORDER_UPDATE
  const queueName = QUEUE.SALES_ORDER_UPDATE
  const dlxName = `${exchangeName}-retry`
  const dlqName = `${queueName}-retry`

  const { channel, connection } = await connectRabbitMQ()

  process.once('SIGINT', async () => {
    await channel.close()
    await connection.close()
  })

  try {
    // Setup DLX for retries
    await channel.assertExchange(dlxName, 'fanout', { durable: true })
    await channel.assertQueue(dlqName, {
      durable: true,
      arguments: {
        'x-message-ttl': 30000, // 30 seconds delay before retry
        'x-dead-letter-exchange': exchangeName
      }
    })
    await channel.bindQueue(dlqName, dlxName, '')

    // Setup Main Exchange and Queue
    await channel.assertExchange(exchangeName, 'fanout', { durable: true })
    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlxName
      }
    })
    await channel.bindQueue(queueName, exchangeName, '')

    await channel.prefetch(1)

    await channel.consume(
      queueName,
      async (msg) => {
        if (!msg) return

        const payload = JSON.parse(msg.content.toString())
        await methodExecution(payload, channel, msg)
      },
      { noAck: false }
    )

    console.info(`[Worker] Sales Order Update listener initialized on queue: ${queueName}`)
  } catch (error) {
    console.error('[Worker] Failed to initialize Sales Order Update listener:', error)
  }
}

module.exports = {
  initSalesOrderUpdateServices
}
