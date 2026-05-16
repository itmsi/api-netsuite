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
    return res.status(201).json({
      success: true,
      data: {
        success: true,
        poId: result.data.poId,
        local_id: result.data.event_id
      },
      message: 'Purchase order berhasil dibuat'
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

    const result = await service.updatePurchaseOrder(req.body, req.user);
    return res.status(200).json({
      success: true,
      data: {
        success: true,
        poId: result.data.poId,
        local_id: result.data.event_id
      },
      message: 'Purchase order update berhasil diinisiasi'
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

    await syncService.upsertSync(
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
    await syncService.upsertSync(
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
    const result = await service.receiveItemPurchaseOrder(req.body, req.user);

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
        await service.retryPurchaseOrder(po.id, req.user, 'CREATE');
        retryTriggered = true;
        console.info(`[Controller] Auto-triggered retry queue for failed PO: ${po.id}`);
      } catch (retryErr) {
        console.error(`[Controller] Failed to auto-trigger retry for PO ${po.id}:`, retryErr.message);
      }
    } else if (po) {
      try {
        await service.retryPurchaseOrder(po.id, req.user, 'UPDATE');
        retryTriggered = true;
        console.info(`[Controller] Auto-triggered retry queue for failed PO: ${po.id}`);
      } catch (retryErr) {
        console.error(`[Controller] Failed to auto-trigger retry for PO ${po.id}:`, retryErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: '',
      data: po ? [po] : [],
      timestamp: new Date().toISOString()
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

    await syncService.upsertSync(
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
    await syncService.upsertSync(
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
 * Batch sync purchase orders by status 'pendingBillPartReceived'
 * POST /purchasing-orders/sync/byidall
 */
const syncByIdAll = async (req, res) => {
  try {
    const result = await service.syncPurchaseOrdersByIdAll();

    await syncService.upsertSync(
      { sync_module: 'purchasing_orders', sync_status: 'success' },
      req.user
    );

    const syncInfo = await syncService.getLatestSyncInfo('purchasing_orders').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: 'Sync all purchase orders by status pendingBillPartReceived berhasil'
      }
    });
  } catch (error) {
    await syncService.upsertSync(
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

    await syncService.upsertSync(
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
    await syncService.upsertSync(
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

const getReceiveHistoryLogs = async (req, res) => {
  try {
    const result = await service.getReceiveHistoryLogs(req.body);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: 'Data history logs berhasil diambil'
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
 * Get items by po_id
 */
const getItems = async (req, res) => {
  try {
    const result = await service.getItems(req.body);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: 'Data items berhasil diambil'
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

const nextcloud = require('../../utils/nextcloud');
const path = require('path');

/**
 * Upload file to Nextcloud Temp Directory
 * @route POST /api/netsuite/purchasing-orders/upload
 */
const uploadTempFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { po_id } = req.body;
    const fileName = `${Date.now()}_${file.originalname}`;
    const uploadDir = nextcloud.NEXTCLOUD_UPLOAD_DIR;
    const filePath = `${uploadDir}/${fileName}`;

    // Ensure upload dir exists
    await nextcloud.ensureDirectoryExists(uploadDir);

    // Upload to Nextcloud WebDAV
    await nextcloud.client.putFileContents(filePath, file.buffer);

    // Generate public share link
    const shareUrl = await nextcloud.generateShareLink(filePath);

    // If po_id provided, save to DB now, else wait for finalize
    if (po_id) {
      await service.saveFileRecord({
        po_id,
        file_name: fileName,
        storage_provider: 'nextcloud',
        storage_path: filePath,
        share_url: shareUrl
      });
    }

    return res.status(200).json({
      success: true,
      path: shareUrl,
      storage_path: filePath,
      file_name: fileName
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file to Nextcloud',
      error: error.message
    });
  }
};

/**
 * Finalize file upload by moving from temp to po folder
 * @route POST /api/netsuite/purchasing-orders/upload/finalize
 */
const finalizeUpload = async (req, res) => {
  try {
    const { po_id, storage_path } = req.body;

    if (!po_id || !storage_path) {
      return res.status(400).json({ success: false, message: 'po_id and storage_path are required' });
    }

    const fileName = path.basename(storage_path);
    const year = new Date().getFullYear();
    const finalDir = `/uploads/po/${year}/${po_id}`;
    const finalPath = `${finalDir}/${fileName}`;

    // Ensure final dir exists
    await nextcloud.ensureDirectoryExists(finalDir);

    // Move file
    await nextcloud.client.moveFile(storage_path, finalPath);

    // We don't regenerate share link as requested, but we should update DB
    await service.updateFileRecord(storage_path, finalPath, null);

    return res.status(200).json({
      success: true,
      path: finalPath
    });
  } catch (error) {
    console.error('Error finalizing upload:', error);
    return res.status(500).json({
      success: false,
      path: null,
      message: 'Failed to finalize file upload',
      error: error.message
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
  syncByIdAll,
  retry,
  getReceiveHistoryLogs,
  getItems,
  uploadTempFile,
  finalizeUpload
};
