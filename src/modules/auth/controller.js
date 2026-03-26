const service = require('./service');
const { baseResponse } = require('../../utils');

/**
 * Get token from external API
 */
const getToken = async (req, res) => {
  try {
    const result = await service.getToken();
    return baseResponse(res, { 
      data: result,
      message: 'Token berhasil diambil' 
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      errors: error
    });
  }
};

module.exports = {
  getToken
};
