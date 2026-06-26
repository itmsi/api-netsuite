const { logger, logDateFormat, fullDateFormat } = require('../utils')
const { initEmailServices } = require('./email_listener')
const { initPurchaseOrderServices } = require('./purchase_order_listener')
const { initPurchaseOrderRetryServices } = require('./purchase_order_retry_listener')
const { initPurchaseOrderUpdateServices } = require('./purchase_order_update_listener')
const { initPurchaseOrderReceiveServices } = require('./purchase_order_receive_listener')
const { initSyncModuleServices } = require('./sync_listener')
const { initCustomerServices } = require('./customer_listener')
const { initPurchaseOrderApprovalServices } = require('./purchase_order_approval_listener')
const { initSalesOrderServices } = require('./sales_order_listener')
const { initSalesOrderUpdateServices } = require('./sales_order_update_listener')
const { initSyncOrchestratorServices } = require('./sync_orchestrator_listener')
const { initEmailNotificationServices } = require('./email_notification_listener')
const { initQuotationCreateService } = require('./quotation_listener')
const { initQuotationUpdateService } = require('./quotation_update_listener')

const initListener = async () => {
  // Increase max listeners for SIGINT as we have many listeners (11)
  process.setMaxListeners(20)
  const fileName = `listener-${logDateFormat()}.txt`
  try {
    console.info('Listener is working waiting for message')
    await initEmailServices()
    await initPurchaseOrderServices()
    await initPurchaseOrderRetryServices()
    await initPurchaseOrderUpdateServices()
    await initPurchaseOrderReceiveServices()
    await initSyncModuleServices()
    await initCustomerServices()
    await initPurchaseOrderApprovalServices()
    await initSalesOrderServices()
    await initSalesOrderUpdateServices()
    await initSyncOrchestratorServices()
    await initEmailNotificationServices()
    await initQuotationCreateService()
    await initQuotationUpdateService()
    logger(fileName, 'listener').write(`Listener is working waiting for message ${fullDateFormat(new Date().toISOString())} \n`)
  } catch (error) {
    console.info('Listener is not working with error', error)
    logger(fileName, 'listener').write(`Listener is not working with error ${fullDateFormat(new Date().toISOString())} ${error}\n`)
  }
}

module.exports = {
  initListener
}