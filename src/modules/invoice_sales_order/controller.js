const service = require('./service');
const { baseResponse } = require('../../utils');

/**
 * Get invoice sales orders list
 */
const getList = async (req, res) => {
  try {
    const result = await service.getInvoiceSalesOrders(req.body);
    return baseResponse(res, { 
      data: result
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
  getList
};
