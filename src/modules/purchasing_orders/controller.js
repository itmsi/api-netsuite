const service = require('./service');
const syncService = require('../sync/service');
const { baseResponse, decodeToken } = require('../../utils');

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
 * Get purchasing orders dashboard (no pagination)
 */
const dashboard = async (req, res) => {
  try {
    const result = await service.getDashboard(req.body);

    const syncInfo = await syncService.getLatestSyncInfo('purchasing_orders').catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: 'Data purchase orders dashboard berhasil diambil'
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

    const createdPayload = decodeToken('created', req);
    const userId = createdPayload.created_by || 'system';

    const result = await service.createPurchaseOrder(req.body, req.user, userId);
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

    const updatedPayload = decodeToken('updated', req);
    const userId = updatedPayload.updated_by || updatedPayload.update_by || 'system';

    const result = await service.updatePurchaseOrder(req.body, req.user, userId);
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
    // di hide dulu karena sudah ada auto retry di queue-process pakek detleter di rabbit mq
    // let retryTriggered = false;
    // if (po && po.po_status === 'failed') {
    //   try {
    //     await service.retryPurchaseOrder(po.id, req.user, 'CREATE');
    //     retryTriggered = true;
    //     console.info(`[Controller] Auto-triggered retry queue for failed PO: ${po.id}`);
    //   } catch (retryErr) {
    //     console.error(`[Controller] Failed to auto-trigger retry for PO ${po.id}:`, retryErr.message);
    //   }
    // } else if (po) {
    //   try {
    //     await service.retryPurchaseOrder(po.id, req.user, 'UPDATE');
    //     retryTriggered = true;
    //     console.info(`[Controller] Auto-triggered retry queue for failed PO: ${po.id}`);
    //   } catch (retryErr) {
    //     console.error(`[Controller] Failed to auto-trigger retry for PO ${po.id}:`, retryErr.message);
    //   }
    // }

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

    const { po_id, file_name } = req.body;

    // Extract original extension
    const extension = path.extname(file.originalname);

    // Determine the base name to use
    let baseName = file_name || file.originalname;
    if (path.extname(baseName)) {
      baseName = path.basename(baseName, path.extname(baseName));
    }

    // Normalize characters to lowercase and replace spaces with underscore
    const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');

    // Combine to form the finalized file name
    const fileName = `${Date.now()}_${normalizedBaseName}${extension}`;
    const uploadDir = nextcloud.NEXTCLOUD_UPLOAD_DIR;
    const filePath = `${uploadDir}/${fileName}`;

    // Ensure upload dir exists
    await nextcloud.ensureDirectoryExists(uploadDir);

    // Upload to Nextcloud WebDAV
    await nextcloud.client.putFileContents(filePath, file.buffer);

    // Generate public share link
    const shareUrl = await nextcloud.generateShareLink(filePath);

    // If po_id provided, save to DB now, else wait for finalize
    let result = {};
    if (po_id) {
      result = await service.saveFileRecord({
        po_id,
        file_name: fileName,
        file_name_original: file_name,
        storage_provider: 'nextcloud',
        storage_path: filePath,
        share_url: shareUrl
      });
    }

    return res.status(200).json({
      success: true,
      id: result?.id || null,
      poId: po_id || null,
      fileUrl: shareUrl,
      storagePath: filePath,
      fileName: file_name
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
 * 1. user create po
 * 2. user masukan file attachment dan tekan add, otomatis UI akan hit ke api /purchasing-orders/upload ketika klik add file, 
 * 3. ada rspin url dan path
 * 4. user klik create po maka otomati dari UI akan menambahkan body "po_id": dari fe, di files, nanti dari api akan otomatis mengakses finalizeUpload
 * 5. proses di api, ketika create po di listener, jika berhasil maka akan mendapatkan respon po_id, nah nanti pindahkan semua file dengan po_id sementara, masukn ke dalam folder /uploads/po/${year}/${po_id} ini po id nya pakek po id hasil respon create po di listener.
 */

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

/**
 * Delete file by share_url from local database and Nextcloud
 * @route POST /api/netsuite/purchasing-orders/upload-delete
 */
const deleteUpload = async (req, res) => {
  try {
    const { fileUrl } = req.body;
    if (!fileUrl) {
      return res.status(400).json({ success: false, message: 'Parameter fileUrl is required' });
    }

    // 1. Get file record from DB to retrieve nextcloud storage_path and ID
    const fileRecord = await service.getFileRecordByShareUrl(fileUrl);
    if (!fileRecord) {
      //jika file tidak ada maka di anggap sukses saja, karena file masuk bukan dari apps tapi dari netsuitenya langunsg, jadi ini jangan sampai stoper respon error
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
      // return res.status(404).json({ success: false, message: 'File record not found for the provided fileUrl' });
    }

    // 2. Delete file from Nextcloud WebDAV
    try {
      const exists = await nextcloud.client.exists(fileRecord.storage_path);
      if (exists) {
        await nextcloud.client.deleteFile(fileRecord.storage_path);
        console.info(`[Controller] Deleted file from Nextcloud: ${fileRecord.storage_path}`);
      } else {
        console.warn(`[Controller] File not found in Nextcloud at path: ${fileRecord.storage_path}`);
      }
    } catch (ncError) {
      console.error(`[Controller] Failed to delete file from Nextcloud:`, ncError.message);
    }

    // 3. Delete file record from Database
    await service.deleteFileRecord(fileRecord.id);

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting uploaded file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
};

/**
 * Update or create uploaded file by share_url (either replacement file, new file_name, or both)
 * If the file does not exist by share_url, it creates a new record using the provided po_id.
 * @route POST /api/netsuite/purchasing-orders/upload-update
 */
const updateUpload = async (req, res) => {
  try {
    const { fileUrl, file_name, po_id } = req.body;
    const file = req.file; // New file uploaded (optional for update, required for create)

    if (!fileUrl) {
      return res.status(400).json({ success: false, message: 'Parameter fileUrl is required' });
    }

    // 1. Get existing file record from DB by share_url
    const fileRecord = await service.getFileRecordByShareUrl(fileUrl);

    if (!fileRecord) {
      // SCENARIO C: File does not exist, CREATE a new one directly in the NetSuite PO folder
      if (!file) {
        return res.status(400).json({ success: false, message: 'File record not found for the provided fileUrl, and no new file was uploaded to create a new record.' });
      }

      if (!po_id) {
        return res.status(400).json({ success: false, message: 'po_id is required to create a new file record.' });
      }

      // Determine folder name by po_id or po_number
      let folderName = po_id;
      try {
        const poRecord = await service.getPurchaseOrderByPoId(po_id);
        if (poRecord && poRecord.po_number) {
          folderName = poRecord.po_number;
          console.info(`[Controller] Found po_number: ${folderName} for po_id: ${po_id}`);
        }
      } catch (dbErr) {
        console.warn(`[Controller] Error fetching po_number for new upload:`, dbErr.message);
      }

      const year = new Date().getFullYear();
      const finalDir = `/NetSuite/PurchasingOrders/${year}/${folderName}`;

      // Ensure directory exists in Nextcloud
      await nextcloud.ensureDirectoryExists(finalDir);

      // Process the file name
      const extension = path.extname(file.originalname);
      let baseName = file_name || file.originalname;
      if (path.extname(baseName)) {
        baseName = path.basename(baseName, path.extname(baseName));
      }
      const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');
      const finalFileName = `${Date.now()}_${normalizedBaseName}${extension}`;
      const finalStoragePath = `${finalDir}/${finalFileName}`;

      // Upload file to Nextcloud
      await nextcloud.client.putFileContents(finalStoragePath, file.buffer);

      // Generate public share link
      let finalShareUrl = '';
      try {
        finalShareUrl = await nextcloud.generateShareLink(finalStoragePath);
      } catch (shareErr) {
        console.warn(`[Controller] Failed to generate share link for new file:`, shareErr.message);
      }

      // Save to Database
      const newRecord = await service.saveFileRecord({
        po_id: po_id,
        file_name: finalFileName,
        file_name_original: file_name || file.originalname,
        storage_provider: 'nextcloud',
        storage_path: finalStoragePath,
        share_url: finalShareUrl
      });

      return res.status(200).json({
        success: true,
        message: 'File created successfully',
        data: {
          id: newRecord.id,
          poId: newRecord.po_id,
          fileUrl: newRecord.share_url,
          storagePath: newRecord.storage_path,
          fileName: newRecord.file_name_original
        }
      });
    }

    // SCENARIO A & B: File exists, perform UPDATE
    const oldStoragePath = fileRecord.storage_path;
    const parentDir = path.dirname(oldStoragePath);

    let finalFileName = fileRecord.file_name;
    let finalOriginalName = fileRecord.file_name_original;
    let finalStoragePath = oldStoragePath;
    let finalShareUrl = fileRecord.share_url;

    if (file) {
      // 1. Delete old file from Nextcloud
      try {
        const oldExists = await nextcloud.client.exists(oldStoragePath);
        if (oldExists) {
          await nextcloud.client.deleteFile(oldStoragePath);
        }
      } catch (ncErr) {
        console.warn(`[Controller] Could not delete old file in Nextcloud: ${oldStoragePath}`, ncErr.message);
      }

      // 2. Determine new file name
      const extension = path.extname(file.originalname);
      let baseName = file_name || file.originalname;
      if (path.extname(baseName)) {
        baseName = path.basename(baseName, path.extname(baseName));
      }
      const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');
      finalFileName = `${Date.now()}_${normalizedBaseName}${extension}`;
      finalOriginalName = file_name || file.originalname;
      finalStoragePath = `${parentDir}/${finalFileName}`;

      // 3. Upload new file contents to Nextcloud
      await nextcloud.client.putFileContents(finalStoragePath, file.buffer);

      // 4. Generate new share link
      try {
        finalShareUrl = await nextcloud.generateShareLink(finalStoragePath);
      } catch (shareErr) {
        console.warn(`[Controller] Failed to generate new share link:`, shareErr.message);
      }
    } else if (file_name) {
      const extension = path.extname(fileRecord.file_name);
      let baseName = file_name;
      if (path.extname(baseName)) {
        baseName = path.basename(baseName, path.extname(baseName));
      }
      const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');
      finalFileName = `${Date.now()}_${normalizedBaseName}${extension}`;
      finalOriginalName = file_name;
      finalStoragePath = `${parentDir}/${finalFileName}`;

      // Move/rename in Nextcloud
      try {
        const oldExists = await nextcloud.client.exists(oldStoragePath);
        if (oldExists) {
          await nextcloud.client.moveFile(oldStoragePath, finalStoragePath);
        }
      } catch (ncErr) {
        console.error(`[Controller] Failed to rename file in Nextcloud:`, ncErr.message);
        return res.status(500).json({ success: false, message: 'Failed to rename file in Nextcloud', error: ncErr.message });
      }

      // Regenerate public link for renamed file path
      try {
        finalShareUrl = await nextcloud.generateShareLink(finalStoragePath);
      } catch (shareErr) {
        console.warn(`[Controller] Failed to generate new share link for renamed file:`, shareErr.message);
      }
    }

    // Update database record by ID
    const updatedRecord = await service.updateFileRecordFields(fileRecord.id, {
      file_name: finalFileName,
      file_name_original: finalOriginalName,
      storage_path: finalStoragePath,
      share_url: finalShareUrl
    });

    return res.status(200).json({
      success: true,
      message: 'File updated successfully',
      data: {
        id: updatedRecord.id,
        poId: updatedRecord.po_id,
        fileUrl: updatedRecord.share_url,
        storagePath: updatedRecord.storage_path,
        fileName: updatedRecord.file_name_original
      }
    });

  } catch (error) {
    console.error('Error updating/creating uploaded file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update/create file',
      error: error.message
    });
  }
};

module.exports = {

  getList,
  dashboard,
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
  finalizeUpload,
  deleteUpload,
  updateUpload
};
