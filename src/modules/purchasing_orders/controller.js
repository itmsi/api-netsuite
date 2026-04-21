const service = require('./service');
const syncService = require('../sync/service');
const { baseResponse } = require('../../utils');

/**
 * Get purchasing orders list
 */
const getList = async (req, res) => {
  try {
    const result = await service.getPurchaseOrders(req.body);

    const syncInfo = await syncService.getLatestSyncInfo('purchasing_orders').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: 'Data purchase orders berhasil diambil'
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
 * Create new purchase order
 */
const create = async (req, res) => {
  try {
    // Automate fields
    if (req.user && req.user.email) {
      req.body.custbody_msi_createdby_api = req.user.email;
    }

    if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
      // Pick department from first item if missing at top level
      if (!req.body.department && req.body.items[0].department) {
        req.body.department = req.body.items[0].department;
      }

      req.body.items = req.body.items.map(item => ({
        ...item,
        rate: (item.custcol_msi_fob || 0) + (item.custcol_me_landed_cost || 0)
      }));
    }

    const result = await service.createPurchaseOrder(req.body, req.user);
    return baseResponse(res, {
      code: 201,
      data: {
        success: true,
        data: result,
        message: 'Purchase order berhasil dibuat'
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
 * Update purchase order
 */
const update = async (req, res) => {
  try {
    // Automate fields
    if (req.user && req.user.email) {
      req.body.custbody_msi_createdby_api = req.user.email;
    }

    if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
      // Pick department from first item if missing at top level
      if (!req.body.department && req.body.items[0].department) {
        req.body.department = req.body.items[0].department;
      }

      req.body.items = req.body.items.map(item => ({
        ...item,
        rate: (item.custcol_msi_fob || 0) + (item.custcol_me_landed_cost || 0)
      }));
    }

    const result = await service.updatePurchaseOrder(req.body);
    return baseResponse(res, {
      code: 200,
      data: {
        success: true,
        data: result,
        message: 'Purchase order berhasil diupdate'
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
 * Sync purchase orders dari bridge API (hit API, return format sama dengan get-list)
 */
const sync = async (req, res) => {
  try {
    const result = await service.syncPurchaseOrders(req.body, req.user);

    await syncService.createSync(
      { sync_module: 'purchasing_orders', sync_status: 'success' },
      req.user
    );

    const syncInfo = await syncService.getLatestSyncInfo('purchasing_orders').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: 'Data purchase orders berhasil di-sync dari bridge API'
      }
    });
  } catch (error) {
    await syncService.createSync(
      { sync_module: 'purchasing_orders', sync_status: 'failed' },
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
 * Approve purchase order
 */
const approve = async (req, res) => {
  try {
    const result = await service.approvePurchaseOrder(req.body);
    return baseResponse(res, {
      data: result
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
 * Receive item for purchase order
 */
const receiveItem = async (req, res) => {
  try {
    const result = await service.receiveItemPurchaseOrder(req.body);

    // Jika sukses, trigger sync untuk record yang baru dibuat
    if (result && result.success && result.goods_receipts && Array.isArray(result.goods_receipts)) {
      for (const gr of result.goods_receipts) {
        if (gr.id) {
          // Sync record baru ke database lokal
          await service.syncReceiveList({
            filters: {
              receipt_ids: [gr.id.toString()]
            }
          }).catch(err => {
            console.error(`Auto-sync failed for GR ${gr.id}:`, err.message);
          });
        }
      }
    }

    return baseResponse(res, {
      code: 200,
      data: result
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
 * Get purchase order by ID (po_id integer atau UUID)
 * Jika po_status = failed, otomatis trigger retry queue
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Parameter id tidak boleh kosong' });
    }

    const result = await service.getPurchaseOrderById(id);
    const po = result.data;

    // Jika po_status = failed, auto-trigger retry queue
    let retryTriggered = false;
    if (po && po.po_status === 'failed') {
      try {
        await service.retryPurchaseOrder(po.id, req.user);
        retryTriggered = true;
        console.info(`[Controller] Auto-triggered retry queue for failed PO: ${po.id}`);
      } catch (retryErr) {
        console.error(`[Controller] Failed to auto-trigger retry for PO ${po.id}:`, retryErr.message);
      }
    }

    return baseResponse(res, {
      data: po,
      retry_triggered: retryTriggered,
      message: retryTriggered ? 'Purchase order ditemukan dan retry queue sudah dijalankan' : undefined
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
 * Sync purchase order by ID dari bridge API
 * GET /purchasing-orders/sync/:id
 */
const syncById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Parameter id tidak boleh kosong' });
    }

    const result = await service.syncPurchaseOrderById(id);

    await syncService.createSync(
      { sync_module: 'purchasing_orders', sync_status: 'success' },
      req.user
    );

    const syncInfo = await syncService.getLatestSyncInfo('purchasing_orders').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: `Purchase order ID ${id} berhasil di-sync dari bridge API`
      }
    });
  } catch (error) {
    await syncService.createSync(
      { sync_module: 'purchasing_orders', sync_status: 'failed' },
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
 * Print purchase order
 */
const print = async (req, res) => {
  try {
    const result = await service.printPurchaseOrder(req.body);
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

/**
 * Get receive list (Goods Receipt / Item Receipt)
 */
const getReceiveList = async (req, res) => {
  try {
    const result = await service.getReceiveList(req.body);

    const syncInfo = await syncService.getLatestSyncInfo('receive_list').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: 'Data receives berhasil diambil'
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
 * Sync receive list from bridge API
 */
const syncReceiveList = async (req, res) => {
  try {
    const result = await service.syncReceiveList(req.body);

    await syncService.createSync(
      { sync_module: 'receive_list', sync_status: 'success' },
      req.user
    );

    const syncInfo = await syncService.getLatestSyncInfo('receive_list').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: 'Data receives berhasil di-sync dari bridge API'
      }
    });
  } catch (error) {
    await syncService.createSync(
      { sync_module: 'receive_list', sync_status: 'failed' },
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
 * Get receive detail by ID from local database
 * GET /purchasing-orders/receive-list/:id
 */
const getReceiveById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Parameter id tidak boleh kosong' });
    }

    const result = await service.getReceiveById(id);

    const syncInfo = await syncService.getLatestSyncInfo('receive_list').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: 'Data receives berhasil diambil'
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
 * Manual retry for purchase order creation
 */
const retry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Parameter id tidak boleh kosong' });
    }

    const result = await service.retryPurchaseOrder(id, req.user);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: 'Retry purchase order berhasil diinisiasi'
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
  print,
  sync,
  create,
  update,
  approve,
  receiveItem,
  getReceiveList,
  getReceiveById,
  syncReceiveList,
  getById,
  syncById,
  retry
};
