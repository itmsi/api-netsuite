const service = require('./service');
const { baseResponse } = require('../../utils');

/**
 * Get purchasing orders list
 */
const getList = async (req, res) => {
  try {
    const result = await service.getPurchaseOrders(req.body);
    return baseResponse(res, { 
      data: {
        success: true,
        data: result,
        message: 'Data purchase orders berhasil diambil'
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
 * Create new purchase order
 */
const create = async (req, res) => {
  try {
    const result = await service.createPurchaseOrder(req.body);
    return baseResponse(res, {
      code: 201,
      data: {
        success: true,
        data: result,
        message: 'Purchase order berhasil dibuat'
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
 * Approve purchase order
 */
const approve = async (req, res) => {
  try {
    const result = await service.approvePurchaseOrder(req.body);
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

/**
 * Get purchase order by ID (via NetSuite RESTlet OAuth)
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Parameter id tidak boleh kosong' });
    }
    const result = await service.getPurchaseOrderById(id);
    return baseResponse(res, { data: result });
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
  create,
  approve,
  getById
};
