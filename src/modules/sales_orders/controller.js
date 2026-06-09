const service = require('./service');
const syncService = require('../sync/service');
const { baseResponse, decodeToken } = require('../../utils');

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

    const createdPayload = decodeToken('created', req);
    const userId = createdPayload.created_by || 'system';

    const result = await service.createSalesOrder(req.body, req.user, userId);
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

    const updatedPayload = decodeToken('updated', req);
    const userId = updatedPayload.updated_by || updatedPayload.update_by || 'system';

    const result = await service.updateSalesOrder(req.body, req.user, userId);
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

/**
 * Sync single sales order by ID from bridge API
 * GET /api/netsuite/sales-orders/sync/:id
 */
const syncById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Parameter id tidak boleh kosong' });
    }

    const result = await service.syncSalesOrderById(id);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: `Sync sales order ID ${id} berhasil`
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
 * @route POST /api/netsuite/sales-orders/upload
 */
const uploadTempFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { so_id, file_name } = req.body;

    const extension = path.extname(file.originalname);
    let baseName = file_name || file.originalname;
    if (path.extname(baseName)) {
      baseName = path.basename(baseName, path.extname(baseName));
    }

    const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');
    const fileName = `${Date.now()}_${normalizedBaseName}${extension}`;
    const uploadDir = nextcloud.NEXTCLOUD_UPLOAD_DIR;
    const filePath = `${uploadDir}/${fileName}`;

    await nextcloud.ensureDirectoryExists(uploadDir);
    await nextcloud.client.putFileContents(filePath, file.buffer);
    const shareUrl = await nextcloud.generateShareLink(filePath);

    let result = {};
    if (so_id) {
      result = await service.saveFileRecord({
        so_id,
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
      soId: so_id || null,
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
 * Finalize file upload by moving from temp to so folder
 * @route POST /api/netsuite/sales-orders/upload/finalize
 */
const finalizeUpload = async (req, res) => {
  try {
    const { so_id, storage_path } = req.body;

    if (!so_id || !storage_path) {
      return res.status(400).json({ success: false, message: 'so_id and storage_path are required' });
    }

    const fileName = path.basename(storage_path);
    const year = new Date().getFullYear();
    const finalDir = `/uploads/so/${year}/${so_id}`;
    const finalPath = `${finalDir}/${fileName}`;

    await nextcloud.ensureDirectoryExists(finalDir);
    await nextcloud.client.moveFile(storage_path, finalPath);
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
 * @route POST /api/netsuite/sales-orders/upload-delete
 */
const deleteUpload = async (req, res) => {
  try {
    const { fileUrl } = req.body;
    if (!fileUrl) {
      return res.status(400).json({ success: false, message: 'Parameter fileUrl is required' });
    }

    const fileRecord = await service.getFileRecordByShareUrl(fileUrl);
    if (!fileRecord) {
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    }

    try {
      const exists = await nextcloud.client.exists(fileRecord.storage_path);
      if (exists) {
        await nextcloud.client.deleteFile(fileRecord.storage_path);
      }
    } catch (ncError) {
      console.error(`[Controller] Failed to delete file from Nextcloud:`, ncError.message);
    }

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
 * Update or create uploaded file by share_url
 * @route POST /api/netsuite/sales-orders/upload-update
 */
const updateUpload = async (req, res) => {
  try {
    const { fileUrl, file_name, so_id } = req.body;
    const file = req.file;

    if (!fileUrl) {
      return res.status(400).json({ success: false, message: 'Parameter fileUrl is required' });
    }

    const fileRecord = await service.getFileRecordByShareUrl(fileUrl);

    if (!fileRecord) {
      if (!file) {
        return res.status(400).json({ success: false, message: 'File record not found for the provided fileUrl, and no new file was uploaded to create a new record.' });
      }

      if (!so_id) {
        return res.status(400).json({ success: false, message: 'so_id is required to create a new file record.' });
      }

      let folderName = so_id;
      try {
        const soRecord = await service.getSalesOrderById(so_id);
        if (soRecord && soRecord.items && soRecord.items.length > 0 && soRecord.items[0].tranid) {
          folderName = soRecord.items[0].tranid;
        }
      } catch (dbErr) {
        console.warn(`[Controller] Error fetching tranid for new upload:`, dbErr.message);
      }

      const year = new Date().getFullYear();
      const finalDir = `/NetSuite/SalesOrders/${year}/${folderName}`;

      await nextcloud.ensureDirectoryExists(finalDir);

      const extension = path.extname(file.originalname);
      let baseName = file_name || file.originalname;
      if (path.extname(baseName)) {
        baseName = path.basename(baseName, path.extname(baseName));
      }
      const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');
      const finalFileName = `${Date.now()}_${normalizedBaseName}${extension}`;
      const finalStoragePath = `${finalDir}/${finalFileName}`;

      await nextcloud.client.putFileContents(finalStoragePath, file.buffer);

      let finalShareUrl = '';
      try {
        finalShareUrl = await nextcloud.generateShareLink(finalStoragePath);
      } catch (shareErr) { }

      const newRecord = await service.saveFileRecord({
        so_id: so_id,
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
          soId: newRecord.so_id,
          fileUrl: newRecord.share_url,
          storagePath: newRecord.storage_path,
          fileName: newRecord.file_name_original
        }
      });
    }

    const oldStoragePath = fileRecord.storage_path;
    const parentDir = path.dirname(oldStoragePath);

    let finalFileName = fileRecord.file_name;
    let finalOriginalName = fileRecord.file_name_original;
    let finalStoragePath = oldStoragePath;
    let finalShareUrl = fileRecord.share_url;

    if (file) {
      try {
        const oldExists = await nextcloud.client.exists(oldStoragePath);
        if (oldExists) {
          await nextcloud.client.deleteFile(oldStoragePath);
        }
      } catch (ncErr) { }

      const extension = path.extname(file.originalname);
      let baseName = file_name || file.originalname;
      if (path.extname(baseName)) {
        baseName = path.basename(baseName, path.extname(baseName));
      }
      const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');
      finalFileName = `${Date.now()}_${normalizedBaseName}${extension}`;
      finalOriginalName = file_name || file.originalname;
      finalStoragePath = `${parentDir}/${finalFileName}`;

      await nextcloud.client.putFileContents(finalStoragePath, file.buffer);

      try {
        finalShareUrl = await nextcloud.generateShareLink(finalStoragePath);
      } catch (shareErr) { }
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

      try {
        const oldExists = await nextcloud.client.exists(oldStoragePath);
        if (oldExists) {
          await nextcloud.client.moveFile(oldStoragePath, finalStoragePath);
        }
      } catch (ncErr) {
        return res.status(500).json({ success: false, message: 'Failed to rename file in Nextcloud', error: ncErr.message });
      }

      try {
        finalShareUrl = await nextcloud.generateShareLink(finalStoragePath);
      } catch (shareErr) { }
    }

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
        soId: updatedRecord.so_id,
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
  getById,
  sync,
  create,
  update,
  syncById,
  uploadTempFile,
  finalizeUpload,
  deleteUpload,
  updateUpload
};
