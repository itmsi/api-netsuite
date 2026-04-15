const service = require('./service');
const { baseResponse } = require('../../utils');

/**
 * Get invoice sales orders list (dari DB)
 */
const getList = async (req, res) => {
  try {
    const result = await service.getInvoiceSalesOrders(req.body);
    return baseResponse(res, { 
      data: {
        success: true,
        data: result,
        message: 'Data invoice sales orders berhasil diambil'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      errors: error.errors || error
    });
  }
};

/**
 * Sync invoice sales orders dari bridge API + sync ke fakturs
 */
const sync = async (req, res) => {
  try {
    const result = await service.syncInvoiceSalesOrders(req.body);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: 'Data invoice sales orders berhasil di-sync dari bridge API'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      errors: error.errors || error
    });
  }
};

module.exports = {
  getList,
  sync
};
