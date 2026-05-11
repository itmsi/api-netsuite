const service = require('./service');
const { baseResponse, decodeToken } = require('../../utils');

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sort_by = 'created_at', sort_order = 'desc' } = req.body;
    const data = await service.getAllItems(page, limit, search, sort_by, sort_order);
    return baseResponse(res, { 
      data: {
        success: true,
        data,
        message: 'Data Approval Status berhasil diambil'
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
    const data = await service.getItemById(id);
    return baseResponse(res, { 
      data: {
        success: true,
        data,
        message: 'Detail Approval Status berhasil diambil'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Data tidak ditemukan',
    });
  }
};

const create = async (req, res) => {
  try {
    const createdPayload = decodeToken('created', req);
    const userId = createdPayload.created_by || 'system';
    const data = await service.createItem(req.body, userId);
    return baseResponse(res, { 
      data: {
        success: true,
        data,
        message: 'Data berhasil dibuat' 
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
    const updatedPayload = decodeToken('updated', req);
    const userId = updatedPayload.updated_by || updatedPayload.update_by || 'system';
    const data = await service.updateItem(id, req.body, userId);
    return baseResponse(res, { 
      data: {
        success: true,
        data,
        message: 'Data berhasil diupdate' 
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
    const deletedPayload = decodeToken('deleted', req);
    const userId = deletedPayload.deleted_by || deletedPayload.update_by || 'system';
    await service.deleteItem(id, userId);
    return baseResponse(res, { 
      data: {
        success: true,
        message: 'Data berhasil dihapus' 
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

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
