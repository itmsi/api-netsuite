const service = require('./service');
const { baseResponse } = require('../../utils');

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
        message: 'Data reference berhasil diambil'
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
        message: 'Detail data reference berhasil diambil'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Data reference tidak ditemukan',
    });
  }
};

const create = async (req, res) => {
  try {
    const userId = req.user?.employee_id || req.user?.user_id || req.user?.id;
    const payload = { ...req.body, created_by: userId, updated_by: userId };
    const data = await service.create(payload);
    return baseResponse(res, { 
      data: {
        success: true,
        data,
        message: 'Data reference berhasil dibuat' 
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
    const userId = req.user?.employee_id || req.user?.user_id || req.user?.id;
    const payload = { ...req.body, updated_by: userId };
    const data = await service.update(id, payload);
    return baseResponse(res, { 
      data: {
        success: true,
        data,
        message: 'Data reference berhasil diupdate' 
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
    const userId = req.user?.employee_id || req.user?.user_id || req.user?.id;
    await service.remove(id, userId);
    return baseResponse(res, { 
      data: {
        success: true,
        message: 'Data reference berhasil dihapus' 
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
  getList,
  getById,
  create,
  update,
  remove
};
