const service = require('./service');
const { baseResponse } = require('../../utils');

/**
 * Get classes list (dari DB)
 */
const getList = async (req, res) => {
  try {
    const result = await service.getClassesList(req.body);
    return baseResponse(res, { 
      data: {
        success: true,
        data: result,
        message: 'Data classes berhasil diambil'
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
 * Sync classes dari bridge API
 */
const sync = async (req, res) => {
  try {
    const result = await service.syncClassesList(req.body);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: 'Data classes berhasil di-sync dari bridge API'
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
