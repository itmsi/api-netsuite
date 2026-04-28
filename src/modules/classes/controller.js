const service = require('./service');
const syncService = require('../sync/service');
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
    const result = await service.syncClassesList(req.body, req.user);

    await syncService.createSync(
      { sync_module: 'classes', sync_status: 'success' },
      req.user
    );

    const syncInfo = await syncService.getLatestSyncInfo('classes').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: 'Data classes berhasil di-sync dari bridge API'
      }
    });
  } catch (error) {
    await syncService.createSync(
      { sync_module: 'classes', sync_status: 'failed' },
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
