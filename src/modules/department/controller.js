const service = require('./service');
const syncService = require('../sync/service');
const { baseResponse } = require('../../utils');

/**
 * Get departments list (dari DB)
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

/**
 * Sync departments dari bridge API
 */
const sync = async (req, res) => {
  try {
    const result = await service.syncDepartmentsList(req.body, req.user);

    await syncService.createSync(
      { sync_module: 'departments', sync_status: 'success' },
      req.user
    );

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: 'Data departments berhasil di-sync dari bridge API'
      }
    });
  } catch (error) {
    await syncService.createSync(
      { sync_module: 'departments', sync_status: 'failed' },
      req.user
    ).catch(() => {});

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
