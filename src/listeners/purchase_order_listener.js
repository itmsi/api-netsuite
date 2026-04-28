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

  // Guard: cek status event di DB sebelum proses
  // Jika sudah FAILED atau SUCCESS, ACK langsung (mencegah loop dari DLQ stale messages)
  try {
    const eventStatus = await purchasingService.getEventStatus(event_id)
    if (eventStatus === 'FAILED' || eventStatus === 'SUCCESS') {
      console.info(`[Worker] PO Event ${event_id} already ${eventStatus}, skipping (ACK to clear stale DLQ message)`)
      return channel.ack(msg)
    }
  } catch (guardErr) {
    console.warn(`[Worker] Could not check event status for ${event_id}:`, guardErr.message)
  }

  try {
    // 4. Hit API Netsuite (existing bridge API)
    console.info(`[Worker] Creating PO for Event ID: ${event_id}`)

    // Log start of process
    await purchasingService.logEvent(event_id, 'processing', 'Starting request to bridge API', data)

    // Inject internalid (UUID dari tabel purchase_orders lokal) ke payload
    const dataWithInternalId = { ...data, internalid: po_internal_id }
    const result = await purchasingService.createPurchaseOrderToBridge(dataWithInternalId)

    if (result && (result.success || result.poId || result.po_id)) {
      const poId = result.poId || result.po_id || result.data?.id

      // 5. Update po_id di tabel purchase_orders
      // await purchasingService.updateLocalPOId(po_internal_id, poId)

      // Update outbox event status
      await purchasingService.updateEventStatus(event_id, 'SUCCESS', result)

      // Log success
      await purchasingService.logEvent(event_id, 'success', 'Purchase order created successfully', result)

      // 6. Sync ulang berdasarkan respon "id"
      if (poId) {
        console.info(`[Worker] Triggering sync for PO ID: ${poId}`)
        try {
          await purchasingService.syncPurchaseOrderByIdInternalId(poId, po_internal_id)
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
    try {
      // Safely extract error details, especially from Axios errors
      const errorDetail = error.response ? error.response.data : (error.errors || error);
      const errorMessage = error.response?.data?.message || error.message || String(error);

      console.error(`[Worker] Error processing PO Event ${event_id}:`, errorMessage);

      // Cek apakah masih bisa auto-retry berdasarkan retry_count dan max_retry di DB
      const allowRetry = await purchasingService.canAutoRetry(event_id)

      if (allowRetry) {
        // Increment retry_count di DB dan nack ke DLQ
        const updated = await purchasingService.incrementRetryCount(event_id, errorMessage)
        console.info(`[Worker] Retrying PO Event ${event_id} (retry_count: ${updated?.retry_count}/${updated?.max_retry})`)
        await purchasingService.logEvent(event_id, 'retry', `Retry attempt ${updated?.retry_count}: ${errorMessage}`, errorDetail)
        channel.nack(msg, false, false) // → ke DLX → DLQ (delay 30s) → balik ke main queue
      } else {
        // retry_count sudah mencapai max_retry → FAILED, harus manual retry
        console.error(`[Worker] Max retries reached for PO Event ${event_id}, marking as FAILED (manual retry required)`)
        await purchasingService.updateLocalPOStatus(po_internal_id, 'failed')

        // Simpan request & response ke properties untuk audit
        const failureProperties = { request: data, response: errorDetail };
        await purchasingService.updateEventStatus(event_id, 'FAILED', errorMessage, failureProperties)

        await purchasingService.logEvent(event_id, 'failed', `Max retries reached: ${errorMessage}`, errorDetail)
        channel.ack(msg) // ACK agar tidak retry lagi di RabbitMQ
      }
    } catch (retryErr) {
      console.error(`[Worker] Failed to handle retry logic for PO Event ${event_id}:`, retryErr.message)
      channel.ack(msg) // ACK untuk mencegah loop tak terbatas
    }
  }
}

const initPurchaseOrderServices = async () => {
  if (process.env.RABBITMQ_ENABLED !== 'true') return

  const exchangeName = EXCHANGES.PURCHASE_ORDER_CREATE
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
        'x-message-ttl': 5000, // 5 seconds delay before retry
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
