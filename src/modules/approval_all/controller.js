const service = require('./service');

/**
 * Approval transaksi via bridge API
 */
const approve = async (req, res) => {
  try {
    const result = await service.approvalAll(req.body);
    return res.status(200).json(result);
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
  approve
};
