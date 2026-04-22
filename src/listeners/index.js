const { logger, logDateFormat, fullDateFormat } = require('../utils')
const { initEmailServices } = require('./email_listener')
const { initPurchaseOrderServices } = require('./purchase_order_listener')
const { initPurchaseOrderRetryServices } = require('./purchase_order_retry_listener')
const { initPurchaseOrderUpdateServices } = require('./purchase_order_update_listener')
const { initPurchaseOrderReceiveServices } = require('./purchase_order_receive_listener')

const initListener = async () => {
  const fileName = `listener-${logDateFormat()}.txt`
  try {
    console.info('Listener is working waiting for message')
    await initEmailServices()
    await initPurchaseOrderServices()
    await initPurchaseOrderRetryServices()
    await initPurchaseOrderUpdateServices()
    await initPurchaseOrderReceiveServices()
    logger(fileName, 'listener').write(`Listener is working waiting for message ${fullDateFormat(new Date().toISOString())} \n`)
  } catch (error) {
    console.info('Listener is not working with error', error)
    logger(fileName, 'listener').write(`Listener is not working with error ${fullDateFormat(new Date().toISOString())} ${error}\n`)
  }
}

module.exports = {
  initListener
}