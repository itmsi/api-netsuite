const { connectRabbitMQ } = require('../config/rabbitmq')
const { EXCHANGES, QUEUE } = require('../utils/constant')
const purchasingService = require('../modules/purchasing_orders/service')

/**
 * Listener untuk queue purchase-order-manual-retry
 * Reuse logika yang sama dengan purchase_order_listener (methodExecution)
 */
const methodExecution = async (payload, channel, msg) => {
  const { event_id, po_internal_id, data } = payload

  // Guard: skip jika event sudah FAILED atau SUCCESS
  try {
    const eventStatus = await purchasingService.getEventStatus(event_id)
    if (eventStatus === 'FAILED' || eventStatus === 'SUCCESS') {
      console.info(`[RetryWorker] PO Event ${event_id} already ${eventStatus}, skipping`)
      return channel.ack(msg)
    }
  } catch (guardErr) {
    console.warn(`[RetryWorker] Could not check event status for ${event_id}:`, guardErr.message)
  }

  try {
    console.info(`[RetryWorker] Processing manual retry for Event ID: ${event_id}`)

    await purchasingService.logEvent(event_id, 'processing', 'Manual retry: starting request to bridge API', data)

    const dataWithInternalId = { ...data, internalid: po_internal_id }
    const result = await purchasingService.createPurchaseOrderToBridge(dataWithInternalId)

    if (result && (result.success || result.poId || result.po_id)) {
      const poId = result.poId || result.po_id || result.data?.id

      await purchasingService.updateEventStatus(event_id, 'SUCCESS', result)
      await purchasingService.logEvent(event_id, 'success', 'Manual retry: purchase order created successfully', result)

      if (poId) {
        console.info(`[RetryWorker] Triggering sync for PO ID: ${poId}`)
        try {
          await purchasingService.syncPurchaseOrderByIdInternalId(poId, po_internal_id)
          await purchasingService.logEvent(event_id, 'purchase_order_synced', 'Manual retry sync successful', { po_id: poId })
        } catch (syncError) {
          console.error(`[RetryWorker] Sync failed for PO ID ${poId}:`, syncError.message)
          await purchasingService.logEvent(event_id, 'sync_failed', syncError.message, syncError)
        }
      }
    } else {
      throw new Error(result.message || 'Bridge API returned failure on manual retry')
    }

    channel.ack(msg)
  } catch (error) {
    console.error(`[RetryWorker] Error processing manual retry for PO Event ${event_id}:`, error.message)

    try {
      await purchasingService.updateEventStatus(event_id, 'FAILED')
      await purchasingService.logEvent(event_id, 'failed', `Manual retry failed: ${error.message}`, { error: error.message })
      await purchasingService.updateLocalPOStatus(po_internal_id, 'failed')
    } catch (updateErr) {
      console.error(`[RetryWorker] Failed to update status for PO Event ${event_id}:`, updateErr.message)
    }

    // Manual retry queue tidak melakukan re-retry otomatis — langsung ACK
    channel.ack(msg)
  }
}

const initPurchaseOrderRetryServices = async () => {
  if (process.env.RABBITMQ_ENABLED !== 'true') return

  const exchangeName = EXCHANGES.PURCHASE_ORDER_RETRY
  const queueName = QUEUE.PURCHASE_ORDER_MANUAL_RETRY

  const { channel, connection } = await connectRabbitMQ()

  process.once('SIGINT', async () => {
    await channel.close()
    await connection.close()
  })

  try {
    // Setup exchange dan queue (tanpa DLX — manual retry tidak perlu auto-retry lagi)
    await channel.assertExchange(exchangeName, 'fanout', { durable: true })
    await channel.assertQueue(queueName, { durable: true })
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

    console.info(`[RetryWorker] Purchase Order manual retry listener initialized on queue: ${queueName}`)
  } catch (error) {
    console.error('[RetryWorker] Failed to initialize Purchase Order retry listener:', error)
  }
}

module.exports = {
  initPurchaseOrderRetryServices
}
