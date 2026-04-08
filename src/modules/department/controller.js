const service = require('./service');
const { baseResponse } = require('../../utils');

/**
 * Get departments list
 */
const getList = async (req, res) => {
  try {
    const result = await service.getDepartmentsList(req.body);
    return baseResponse(res, { 
      data: {
        success: true,
        data: result,
        message: 'Data departments berhasil diambil'
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
  getList
};
