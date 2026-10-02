const service = require('./service');
const { baseResponse } = require('../../utils');

/**
 * Get log activities list (dari DB bridge)
 */
const getList = async (req, res) => {
  try {
    const result = await service.getLogActivitiesList(req.body);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: 'Data log activities berhasil diambil'
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
 * Get log activity by id (dari DB bridge)
 */
const getById = async (req, res) => {
  try {
    const result = await service.getLogActivityById(req.params.id, req.query);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: 'Data log activity berhasil diambil'
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
 * Get daftar module_name (sumber BRIDGE_ROUTES.md)
 */
const getModuleNames = async (req, res) => {
  try {
    const result = service.getModuleNames(req.body);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: 'Data module name berhasil diambil'
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
  getModuleNames
};
