const { connectRabbitMQ } = require('../config/rabbitmq')
const {
  EXCHANGES, QUEUE, logger, todayFormat
} = require('../utils')
const purchasingService = require('../modules/purchasing_orders/service')

/**
 * Worker logic for processing purchase order creation
 */
const methodExecution = async (payload, channel, msg) => {
  const { event_id, po_internal_id, data } = payload

  try {
    // 4. Hit API Netsuite (existing bridge API)
    console.info(`[Worker] Creating PO for Event ID: ${event_id}`)

    // Log start of process
    await purchasingService.logEvent(event_id, 'processing', 'Starting request to bridge API', data)

    const result = await purchasingService.createPurchaseOrderToBridge(data)

    if (result && (result.success || result.poId || result.po_id)) {
      const poId = result.poId || result.po_id || result.data?.id

      // 5. Update po_id di tabel purchase_orders
      await purchasingService.updateLocalPOId(po_internal_id, poId)

      // Update outbox event status
      await purchasingService.updateEventStatus(event_id, 'SUCCESS', result)

      // Log success
      await purchasingService.logEvent(event_id, 'success', 'Purchase order created successfully', result)

      // 6. Sync ulang berdasarkan respon "id"
      if (poId) {
        console.info(`[Worker] Triggering sync for PO ID: ${poId}`)
        try {
          await purchasingService.syncPurchaseOrderById(poId)
          await purchasingService.logEvent(event_id, 'purchase_order_synced', 'Purchase order synced successfully', { po_id: poId })
        } catch (syncError) {
          console.error(`[Worker] Sync failed for PO ID ${poId}:`, syncError.message)
          await purchasingService.logEvent(event_id, 'sync_failed', syncError.message, syncError)
        }
      }
    } else {
      throw new Error(result.message || 'Bridge API returned failure')
    }

    channel.ack(msg)
  } catch (error) {
    console.error(`[Worker] Error processing PO Event ${event_id}:`, error.message)

    // Check retry count from RabbitMQ headers
    const deathHeader = msg.properties.headers && msg.properties.headers['x-death']
    const retryCount = deathHeader ? deathHeader[0].count : 0

    if (retryCount < 3) {
      console.info(`[Worker] Retrying PO Event ${event_id} (${retryCount + 1}/3)`)
      // Reject without requeue will move it to DLX (which we will configure as a retry queue)
      channel.nack(msg, false, false)
    } else {
      console.error(`[Worker] Max retries reached for PO Event ${event_id}`)

      // 7. Jika gagal (max retries), update status menjadi 'FAILED'
      await purchasingService.updateLocalPOStatus(po_internal_id, 'failed')
      await purchasingService.updateEventStatus(event_id, 'FAILED', error.message)
      await purchasingService.logEvent(event_id, 'failed', error.message, error)

      channel.ack(msg) // Stop retrying in RabbitMQ
    }
  }
}

const initPurchaseOrderServices = async () => {
  if (process.env.RABBITMQ_ENABLED !== 'true') return

  const exchangeName = EXCHANGES.PURCHASE_ORDER
  const queueName = QUEUE.PURCHASE_ORDER_CREATE
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

    console.info(`[Worker] Purchase Order listener initialized on queue: ${queueName}`)
  } catch (error) {
    console.error('[Worker] Failed to initialize Purchase Order listener:', error)
  }
}

module.exports = {
  initPurchaseOrderServices
}
