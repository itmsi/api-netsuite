const { connectRabbitMQ } = require('../config/rabbitmq')
const {
  EXCHANGES, QUEUE, logger, todayFormat
} = require('../utils')
const salesService = require('../modules/sales_orders/service')

/**
 * Worker logic for processing sales order creation
 */
const methodExecution = async (payload, channel, msg) => {
  const { event_id, so_internal_id, data } = payload

  // Guard: cek status event di DB sebelum proses
  try {
    const eventStatus = await salesService.getEventStatus(event_id)
    if (eventStatus === 'FAILED' || eventStatus === 'SUCCESS') {
      console.info(`[Worker] SO Event ${event_id} already ${eventStatus}, skipping (ACK to clear stale DLQ message)`)
      return channel.ack(msg)
    }
  } catch (guardErr) {
    console.warn(`[Worker] Could not check event status for ${event_id}:`, guardErr.message)
  }

  try {
    // 4. Hit API Netsuite (existing bridge API)
    console.info(`[Worker] Creating SO for Event ID: ${event_id}`)

    // Log start of process
    await salesService.logEvent(event_id, 'processing', 'Starting request to bridge API', data)

    // Inject internalid (UUID dari tabel sales_orders lokal) ke payload
    const dataWithInternalId = { ...data, internalid: so_internal_id }
    const result = await salesService.createSalesOrderToBridge(dataWithInternalId)

    if (result && (result.success || result.soId || result.so_id || result.data?.id)) {
      const soId = result.soId || result.so_id || result.data?.id || result.data?.soId

      // Update outbox event status
      await salesService.updateEventStatus(event_id, 'SUCCESS', result)

      // Log success
      await salesService.logEvent(event_id, 'success', 'Sales order created successfully', result)

      // 6. Sync ulang berdasarkan respon "id"
      if (soId) {
        console.info(`[Worker] Triggering sync for SO ID: ${soId}`)
        try {
          await salesService.syncSalesOrderByIdInternalId(soId, so_internal_id)
          await salesService.logEvent(event_id, 'sales_order_synced', 'Sales order synced successfully', { so_id: soId })
        } catch (syncError) {
          console.error(`[Worker] Sync failed for SO ID ${soId}:`, syncError.message)
          await salesService.logEvent(event_id, 'sync_failed', syncError.message, syncError)
        }
      }
    } else {
      throw new Error(result.message || 'Bridge API returned failure')
    }

    channel.ack(msg)
  } catch (error) {
    try {
      const errorDetail = error.response ? error.response.data : (error.errors || error);
      const errorMessage = error.response?.data?.message || error.message || String(error);

      console.error(`[Worker] Error processing SO Event ${event_id}:`, errorMessage);

      // Cek apakah masih bisa auto-retry
      const allowRetry = await salesService.canAutoRetry(event_id)

      if (allowRetry) {
        const updated = await salesService.incrementRetryCount(event_id, errorMessage)
        console.info(`[Worker] Retrying SO Event ${event_id} (retry_count: ${updated?.retry_count}/${updated?.max_retry})`)
        await salesService.logEvent(event_id, 'retry', `Retry attempt ${updated?.retry_count}: ${errorMessage}`, errorDetail)
        channel.nack(msg, false, false) 
      } else {
        console.error(`[Worker] Max retries reached for SO Event ${event_id}, marking as FAILED`)
        await salesService.updateLocalSalesOrderStatus(so_internal_id, 'failed')

        const failureProperties = { request: data, response: errorDetail };
        await salesService.updateEventStatus(event_id, 'FAILED', errorMessage, failureProperties)

        await salesService.logEvent(event_id, 'failed', `Max retries reached: ${errorMessage}`, errorDetail)
        channel.ack(msg)
      }
    } catch (retryErr) {
      console.error(`[Worker] Failed to handle retry logic for SO Event ${event_id}:`, retryErr.message)
      channel.ack(msg)
    }
  }
}

const initSalesOrderServices = async () => {
  if (process.env.RABBITMQ_ENABLED !== 'true') return

  const exchangeName = EXCHANGES.SALES_ORDER_CREATE
  const queueName = QUEUE.SALES_ORDER_CREATE
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

    console.info(`[Worker] Sales Order listener initialized on queue: ${queueName}`)
  } catch (error) {
    console.error('[Worker] Failed to initialize Sales Order listener:', error)
  }
}

module.exports = {
  initSalesOrderServices
}
