const service = require('./service');
const syncService = require('../sync/service');
const { baseResponse } = require('../../utils');

/**
 * Get bill payment detail by ID (dari DB)
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await service.getBillPaymentById(id);
    return baseResponse(res, { 
      data: {
        success: true,
        data: result,
        message: 'Detail data bill payment berhasil diambil'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Data bill payment tidak ditemukan',
      errors: error.errors || error
    });
  }
};

/**
 * Get bill payments list (dari DB)
 */
const getList = async (req, res) => {
  try {
    const result = await service.getBillPaymentList(req.body);
    return baseResponse(res, { 
      data: {
        success: true,
        data: result,
        message: 'Data bill payments berhasil diambil'
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
 * Sync bill payments dari bridge API
 */
const sync = async (req, res) => {
  try {
    const result = await service.syncBillPaymentList(req.body);

    await syncService.createSync(
      { sync_module: 'bill_payment', sync_status: 'success' },
      req.user
    );

    const syncInfo = await syncService.getLatestSyncInfo('bill_payment').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: 'Data bill payments berhasil di-sync dari bridge API'
      }
    });
  } catch (error) {
    await syncService.createSync(
      { sync_module: 'bill_payment', sync_status: 'failed' },
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
  getById,
  sync
};
