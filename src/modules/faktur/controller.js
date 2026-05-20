const service = require('./service');
const { baseResponse, decodeToken } = require('../../utils');

/**
 * Controller Layer - HTTP Request/Response Handler
 */

const getList = async (req, res) => {
  try {
    const data = await service.getList(req.body);
    return baseResponse(res, { 
      data: {
        success: true,
        data,
        message: 'Data faktur berhasil diambil'
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

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await service.getById(id);
    return baseResponse(res, { 
      data: {
        success: true,
        data,
        message: 'Detail data faktur berhasil diambil'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Data faktur tidak ditemukan',
    });
  }
};

const create = async (req, res) => {
  try {
    const createdPayload = decodeToken('created', req);
    const updatedPayload = decodeToken('updated', req);
    const payload = { ...req.body, ...createdPayload, ...updatedPayload };
    const data = await service.create(payload);
    return baseResponse(res, { 
      data: {
        success: true,
        data,
        message: 'Data faktur berhasil dibuat' 
      },
      code: 201
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const tokenPayload = decodeToken('updated', req);
    const payload = { ...req.body, ...tokenPayload };
    const data = await service.update(id, payload);
    return baseResponse(res, { 
      data: {
        success: true,
        data,
        message: 'Data faktur berhasil diupdate' 
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const tokenPayload = decodeToken('deleted', req);
    const userId = tokenPayload.deleted_by;
    await service.remove(id, userId);
    return baseResponse(res, { 
      data: {
        success: true,
        message: 'Data faktur berhasil dihapus' 
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

const syncFromInvoice = async (req, res) => {
  try {
    const netsuiteIds = req.body.netsuite_ids
      ? req.body.netsuite_ids
      : [req.body.netsuite_id];

    const result = await service.syncFromInvoiceSalesOrders(netsuiteIds);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: 'Data faktur berhasil di-sync dari invoice sales order'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { errors: error.errors || error })
    });
  }
};

const syncFromInvoiceById = async (req, res) => {
  try {
    const { netsuite_id } = req.params;
    const result = await service.syncFromInvoiceSalesOrders([netsuite_id]);
    return baseResponse(res, {
      data: {
        success: true,
        data: result.items[0] || null,
        message: 'Data faktur berhasil di-sync dari invoice sales order'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { errors: error.errors || error })
    });
  }
};

const updateStatusBulk = async (req, res) => {
  try {
    const data = await service.updateStatusBulk(req.body);
    return baseResponse(res, {
      data: {
        success: true,
        data,
        message: 'Status faktur berhasil diupdate secara bulk'
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
  getById,
  create,
  update,
  remove,
  updateStatusBulk,
  syncFromInvoice,
  syncFromInvoiceById
};
