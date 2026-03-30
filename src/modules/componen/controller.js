const service = require('./service');
const { baseResponse } = require('../../utils');

/**
 * Get componen list
 */
const getList = async (req, res) => {
  try {
    const result = await service.getComponenList();
    return baseResponse(res, { 
        data: result,
        message: 'Data componen berhasil diambil'
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
