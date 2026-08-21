const service = require('./service');
const syncService = require('../sync/service');
const { baseResponse } = require('../../utils');

/**
 * Get project segmentations list (dari DB)
 */
const getList = async (req, res) => {
  try {
    const result = await service.getProjectSegmentationsList(req.body);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: 'Data project segmentations berhasil diambil'
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
 * Sync project segmentations dari bridge API
 */
const sync = async (req, res) => {
  try {
    const result = await service.syncProjectSegmentationsList(req.body, req.user);

    await syncService.createSync(
      { sync_module: 'project_segmentations', sync_status: 'success' },
      req.user
    );

    const syncInfo = await syncService.getLatestSyncInfo('project_segmentations').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: 'Data project segmentations berhasil di-sync dari bridge API'
      }
    });
  } catch (error) {
    await syncService.createSync(
      { sync_module: 'project_segmentations', sync_status: 'failed' },
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
