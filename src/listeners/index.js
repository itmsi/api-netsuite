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

const initListener = async () => {
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
    logger(fileName, 'listener').write(`Listener is working waiting for message ${fullDateFormat(new Date().toISOString())} \n`)
  } catch (error) {
    console.info('Listener is not working with error', error)
    logger(fileName, 'listener').write(`Listener is not working with error ${fullDateFormat(new Date().toISOString())} ${error}\n`)
  }
}

module.exports = {
  initListener
}