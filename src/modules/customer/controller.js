const service = require('./service');
const { baseResponse } = require('../../utils');

/**
 * Get customers list
 */
const getList = async (req, res) => {
  try {
    const result = await service.getCustomerList(req.body);
    return baseResponse(res, { 
      data: {
        success: true,
        data: result,
        message: 'Data customers berhasil diambil'
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
 * Create customer
 */
const create = async (req, res) => {
  try {
    const result = await service.createCustomer(req.body);
    return baseResponse(res, { 
      data: {
        success: true,
        data: result,
        message: 'Customer berhasil dibuat'
      },
      code: 201
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
  create
};
