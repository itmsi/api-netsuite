const service = require('./service');
const syncService = require('../sync/service');
const { baseResponse } = require('../../utils');

/**
 * Get quotation detail by ID (dari DB)
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await service.getQuotationById(id);
    return baseResponse(res, { 
      data: {
        success: true,
        data: result,
        message: 'Detail data quotation berhasil diambil'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Data quotation tidak ditemukan',
      errors: error.errors || error
    });
  }
};

/**
 * Get quotations list (dari DB)
 */
const getList = async (req, res) => {
  try {
    const result = await service.getQuotationList(req.body);
    return baseResponse(res, { 
      data: {
        success: true,
        data: result,
        message: 'Data quotations berhasil diambil'
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
 * Force sync satu quotation by netsuite_id dari bridge API
 */
const syncById = async (req, res) => {
  try {
    const { netsuite_id } = req.params;
    const result = await service.syncQuotationById(netsuite_id);

    await syncService.upsertSync(
      { sync_module: 'quotation', sync_status: 'success' },
      req.user
    );

    const syncInfo = await syncService.getLatestSyncInfo('quotation').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: `Quotation netsuite_id ${netsuite_id} berhasil di-sync dari bridge API`
      }
    });
  } catch (error) {
    await syncService.upsertSync(
      { sync_module: 'quotation', sync_status: 'failed' },
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
  syncById,
  create: async (req, res) => {
    try {
      const user = req.user;
      const userId = user?.id || user?.user_id;
      
      const result = await service.createQuotation(req.body, user, userId);

      return baseResponse(res, { 
        data: {
          success: true,
          data: result.data,
          message: result.message
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
  },
  update: async (req, res) => {
    try {
      const user = req.user;
      const userId = user?.id || user?.user_id;

      if (!req.body.id) {
        return res.status(400).json({
          success: false,
          message: 'id is required'
        });
      }
      
      const result = await service.updateQuotation(req.body, user, userId);

      return baseResponse(res, { 
        data: {
          success: true,
          data: result.data,
          message: result.message
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
  }
};
