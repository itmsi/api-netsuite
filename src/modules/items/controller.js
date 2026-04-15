const service = require('./service');
const { baseResponse } = require('../../utils');

/**
 * Get items list (dari DB)
 */
const getList = async (req, res) => {
  try {
    const result = await service.getItemsList(req.body);
    return baseResponse(res, { 
      data: {
        success: true,
        data: result,
        message: 'Data items berhasil diambil'
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
 * Sync items dari bridge API
 */
const sync = async (req, res) => {
  try {
    const result = await service.syncItemsList(req.body);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: 'Data items berhasil di-sync dari bridge API'
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
