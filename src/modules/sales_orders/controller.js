const service = require('./service');
const syncService = require('../sync/service');
const { baseResponse } = require('../../utils');

/**
 * GET list sales orders dari DB lokal (bridge_sanbox)
 * POST /api/netsuite/sales-orders/get
 */
const getList = async (req, res) => {
  try {
    const result = await service.getSalesOrders(req.body);
    const syncInfo = await syncService.getLatestSyncInfo('sales_orders').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: 'Data sales orders berhasil diambil'
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
 * GET sales order by netsuite_id dari DB lokal
 * GET /api/netsuite/sales-orders/:id
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Parameter id tidak boleh kosong' });
    }

    const result = await service.getSalesOrderById(id);
    const syncInfo = await syncService.getLatestSyncInfo('sales_orders').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: `Data sales order ID ${id} berhasil diambil`
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
 * Sync sales orders dari bridge API
 * POST /api/netsuite/sales-orders/sync
 */
const sync = async (req, res) => {
  try {
    const result = await service.syncSalesOrders(req.body);

    await syncService.createSync(
      { sync_module: 'sales_orders', sync_status: 'success' },
      req.user
    );

    const syncInfo = await syncService.getLatestSyncInfo('sales_orders').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: 'Data sales orders berhasil di-sync dari bridge API'
      }
    });
  } catch (error) {
    await syncService.createSync(
      { sync_module: 'sales_orders', sync_status: 'failed' },
      req.user
    ).catch(() => { });

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      errors: error.errors || error
    });
  }
};

/**
 * Create new sales order via bridge API
 * POST /api/netsuite/sales-orders/create
 */
const create = async (req, res) => {
  try {
    if (req.user && req.user.email) {
      req.body.custbody_msi_createdby_api = req.user.email;
    }

    const result = await service.createSalesOrder(req.body, req.user);
    const { success, ...responseData } = result || {};
    return baseResponse(res, {
      code: 201,
      data: {
        success: true,
        data: responseData,
        message: 'Sales order berhasil dibuat'
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
 * Update existing sales order via bridge API
 * PUT /api/netsuite/sales-orders/update
 */
const update = async (req, res) => {
  try {
    if (req.user && req.user.email) {
      req.body.custbody_msi_createdby_api = req.user.email;
    }

    const result = await service.updateSalesOrder(req.body, req.user);
    const { success, ...responseData } = result || {};
    return baseResponse(res, {
      data: {
        success: true,
        data: responseData,
        message: 'Sales order berhasil diupdate'
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
  getList,
  getById,
  sync,
  create,
  update
};
