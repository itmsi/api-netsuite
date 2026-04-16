const service = require('./service');
const syncService = require('../sync/service');
const { baseResponse } = require('../../utils');

/**
 * Get banks list (dari DB)
 */
const getList = async (req, res) => {
  try {
    const result = await service.getBankList(req.body);
    return baseResponse(res, { 
      data: {
        success: true,
        data: result,
        message: 'Data banks berhasil diambil'
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
 * Sync banks dari bridge API
 */
const sync = async (req, res) => {
  try {
    const result = await service.syncBankList(req.body);

    await syncService.createSync(
      { sync_module: 'bank', sync_status: 'success' },
      req.user
    );

    const syncInfo = await syncService.getLatestSyncInfo('bank').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: 'Data banks berhasil di-sync dari bridge API'
      }
    });
  } catch (error) {
    await syncService.createSync(
      { sync_module: 'bank', sync_status: 'failed' },
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
