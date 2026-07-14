const axios = require('axios');
const service = require('./service');
const nextcloud = require('../../utils/nextcloud');
const path = require('path');

const triggerSync = async ({ type, netsuite_id, token }) => {
  try {
    const gatewayBaseUrl = process.env.BRIDGE_BASE_URL || 'http://api-bridge-msi:9570';

    if (type === 'purchase_order') {
      const url = `${gatewayBaseUrl}/api/v1/bridge/purchase-orders/sync/${netsuite_id}`;
      await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log(`[AttachFile] Sync triggered for purchase_order netsuite_id=${netsuite_id}`);
    } else {
      // TODO: handle sync for other types
      console.log(`[AttachFile] Sync not yet implemented for type=${type}`);
    }
  } catch (error) {
    console.error('[AttachFile] Sync trigger error:', error?.response?.data || error.message);
    // Non-blocking: log but don't throw
  }
};

const getList = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc', search = '', netsuite_id = '' } = req.body;

    const filters = {
      search,
      netsuite_id,
      sort_by,
      sort_order
    };

    const result = await service.getList(filters, page, limit);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Data berhasil diambil'
    });
  } catch (error) {
    console.error('Error fetching attach files:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch data',
      error: error.message
    });
  }
};

const create = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { netsuite_id, file_name, type, created_by_api } = req.body;
    const userId = req.user?.employee_id || req.user?.user_id || req.user?.id || req.user?.sub || null;
    const userEmail = req.user?.email || null;

    // Extract original extension
    const extension = path.extname(file.originalname);

    // Determine the base name to use
    let baseName = file_name || file.originalname;
    if (path.extname(baseName)) {
      baseName = path.basename(baseName, path.extname(baseName));
    }

    // Normalize characters to lowercase and replace spaces with underscore
    const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');
    const fileNameOriginal = file_name;

    // Combine to form the finalized file name
    const fileName = `${Date.now()}_${normalizedBaseName}${extension}`;

    const isNetsuiteIdUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(netsuite_id);
    let resolvedNetsuiteId = netsuite_id;

    if (isNetsuiteIdUUID) {
      // netsuite_id berformat UUID → cari di purchase_orders by id, ambil po_id
      const poRecord = await service.getPurchaseOrderById(netsuite_id);
      if (!poRecord || !poRecord.po_id) {
        return res.status(400).json({
          success: false,
          message: 'Netsuite ID tidak ditemukan di data PO'
        });
      }
      resolvedNetsuiteId = poRecord.po_id;
    }

    let uploadDir = nextcloud.NEXTCLOUD_UPLOAD_DIR;

    if (type === 'purchase_order' && resolvedNetsuiteId) {
      const poRecord = await service.getPurchaseOrderByPoId(resolvedNetsuiteId);
      if (poRecord) {
        const year = new Date().getFullYear();
        const folderName = poRecord.po_number || resolvedNetsuiteId;
        uploadDir = `/NetSuite/PurchasingOrders/${year}/${folderName}`;
      }
    }

    const filePath = `${uploadDir}/${fileName}`;

    // Ensure upload dir exists
    await nextcloud.ensureDirectoryExists(uploadDir);

    // Upload to Nextcloud WebDAV
    await nextcloud.client.putFileContents(filePath, file.buffer);

    // Generate public share link
    const shareUrl = await nextcloud.generateShareLink(filePath);

    // If netsuite_id provided, save to DB now, else wait for finalize
    let result = {};
    let bridgeResult = null;
    if (resolvedNetsuiteId) {
      result = await service.saveFileRecord({
        transaction_type: type,
        netsuite_id: resolvedNetsuiteId,
        file_name: fileNameOriginal,
        file_name_original: fileName,
        storage_provider: 'nextcloud',
        storage_path: filePath,
        share_url: shareUrl,
        file_url: shareUrl,
        created_by_api: created_by_api || userEmail || null,
        created_by: userId,
      });

      // Notify bridge API — tunggu response dulu sebelum trigger sync
      bridgeResult = await service.callBridgeCreate({
        localId: result?.id,
        netsuiteId: resolvedNetsuiteId,
        createdByApi: created_by_api || userEmail || null,
        files: [{ fileName: fileNameOriginal, fileUrl: shareUrl }]
      });

      // Trigger sync hanya jika callBridgeCreate berhasil (non-blocking)
      if (bridgeResult) {
        const userToken = (req.headers.authorization || '').replace('Bearer ', '');
        if (userToken) {
          triggerSync({ type, netsuite_id: resolvedNetsuiteId, token: userToken });
        }
      }
    }

    return res.status(200).json({
      success: true,
      id: bridgeResult?.data?.[0]?.netsuite_file_id || null,
      netsuiteId: resolvedNetsuiteId || null,
      fileUrl: shareUrl,
      storagePath: filePath,
      fileName: fileNameOriginal
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

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileUrl, file_name, netsuite_id, type, created_by_api } = req.body;
    const userId = req.user?.employee_id || req.user?.user_id || req.user?.id || req.user?.sub || null;
    const userEmail = req.user?.email || null;
    const file = req.file;

    // Cari record berdasarkan netsuite_file_id (req.params.id)
    const fileRecord = await service.getFileRecordByNetsuiteFileId(id);

    const hasExistingStoragePath = typeof fileRecord?.storage_path === 'string' && fileRecord.storage_path;
    const hasNewFileUpload = Boolean(file);
    const hasFileUrlUpdate = Boolean(fileUrl);
    const hasNameOnlyUpdate = !hasNewFileUpload && !hasFileUrlUpdate && Boolean(file_name);
    const shouldUseNextcloud = hasNewFileUpload || (hasExistingStoragePath && !hasNameOnlyUpdate && !hasFileUrlUpdate);

    let dirPath = nextcloud.NEXTCLOUD_UPLOAD_DIR;
    if (hasExistingStoragePath) {
      dirPath = path.dirname(fileRecord.storage_path);
    }
    if (type === 'purchase_order' && netsuite_id) {
      const poRecord = await service.getPurchaseOrderByPoId(netsuite_id);
      if (poRecord) {
        const year = new Date().getFullYear();
        const folderName = poRecord.po_number || netsuite_id;
        dirPath = `/NetSuite/PurchasingOrders/${year}/${folderName}`;
      }
    }

    if (shouldUseNextcloud) {
      await nextcloud.ensureDirectoryExists(dirPath);
    }

    // If record not found in local DB, insert it (and upload file if present)
    if (!fileRecord) {
      let createdRecord = {};

      let createdStoragePath = null;
      let createdShareUrl = null;
      let createdFileName = null;

      if (hasNewFileUpload) {
        const extension = path.extname(file.originalname);
        let baseName = file_name || file.originalname;
        if (path.extname(baseName)) {
          baseName = path.basename(baseName, path.extname(baseName));
        }
        const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');
        createdFileName = `${Date.now()}_${normalizedBaseName}${extension}`;

        createdStoragePath = `${dirPath}/${createdFileName}`;
        await nextcloud.client.putFileContents(createdStoragePath, file.buffer);
        createdShareUrl = await nextcloud.generateShareLink(createdStoragePath);
      }

      // Save minimal record to DB
      createdRecord = await service.saveFileRecord({
        transaction_type: type,
        netsuite_id: netsuite_id || null,
        netsuite_file_id: id || null,
        file_name: file_name || (hasNewFileUpload ? file.originalname : null),
        file_name_original: createdFileName || null,
        storage_provider: createdStoragePath ? 'nextcloud' : null,
        storage_path: createdStoragePath,
        share_url: createdShareUrl,
        file_url: createdShareUrl,
        created_by_api: created_by_api || userEmail || null,
        created_by: userId,
      });

      // Notify bridge API (non-blocking)
      try {
        const bridgeResult = await service.callBridgeUpdate({
          bridgeId: id,
          fileName: file_name,
          fileUrl: createdShareUrl || fileUrl || null
        });

        // Trigger sync hanya jika callBridgeCreate berhasil (non-blocking)
        if (bridgeResult) {
          const userToken = (req.headers.authorization || '').replace('Bearer ', '');
          if (userToken) {
            triggerSync({ type, netsuite_id, token: userToken });
          }
        }
      } catch (notifyErr) {
        console.warn('Bridge create notification failed:', notifyErr?.message || notifyErr);
      }

      return res.status(200).json({
        success: true,
        message: 'File record created locally',
        data: {
          id: id || null,
          netsuiteId: netsuite_id || null,
          fileUrl: createdShareUrl || fileUrl || null,
          fileName: file_name || null
        }
      });
    }

    // Existing record — proceed to update
    let finalStoragePath = fileRecord.storage_path;
    let finalShareUrl = fileRecord.share_url;
    let finalFileName = fileRecord.file_name;

    // SCENARIO: File was uploaded, replace existing file
    if (hasNewFileUpload) {
      const extension = path.extname(file.originalname);
      let baseName = file_name || file.originalname;
      if (path.extname(baseName)) {
        baseName = path.basename(baseName, path.extname(baseName));
      }
      const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');
      finalFileName = `${Date.now()}_${normalizedBaseName}${extension}`;

      finalStoragePath = `${dirPath}/${finalFileName}`;

      await nextcloud.client.putFileContents(finalStoragePath, file.buffer);
      finalShareUrl = await nextcloud.generateShareLink(finalStoragePath);

      // Try to delete old file
      try {
        const exists = await nextcloud.client.exists(fileRecord.storage_path);
        if (exists) {
          await nextcloud.client.deleteFile(fileRecord.storage_path);
        }
      } catch (e) {
        console.warn(`Could not delete old file in Nextcloud: ${fileRecord.storage_path}`, e.message);
      }
    } else if (hasFileUrlUpdate) {
      // SCENARIO: Only remote file URL changed; keep existing storage path untouched.
      finalShareUrl = fileUrl;
    } else if (hasNameOnlyUpdate) {
      finalFileName = file_name;
      finalShareUrl = fileRecord.share_url;
      finalStoragePath = fileRecord.storage_path;
    } else if (hasExistingStoragePath && (file_name || dirPath !== path.dirname(fileRecord.storage_path))) {
      // SCENARIO: Only file_name changes or directory changes
      const extension = path.extname(fileRecord.storage_path);
      let baseName = file_name || fileRecord.file_name;
      if (path.extname(baseName)) {
        baseName = path.basename(baseName, path.extname(baseName));
      }
      const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, '_');
      finalFileName = `${Date.now()}_${normalizedBaseName}${extension}`;

      finalStoragePath = `${dirPath}/${finalFileName}`;

      if (fileRecord.storage_path !== finalStoragePath) {
        try {
          await nextcloud.client.moveFile(fileRecord.storage_path, finalStoragePath);
          finalShareUrl = await nextcloud.generateShareLink(finalStoragePath);
        } catch (ncError) {
          console.error('Error renaming/moving in Nextcloud:', ncError);
          return res.status(500).json({ success: false, message: 'Failed to move file in Nextcloud', error: ncError.message });
        }
      }
    }

    const updateData = {};
    if (hasNewFileUpload || file_name || hasFileUrlUpdate || (hasExistingStoragePath && dirPath !== path.dirname(fileRecord.storage_path))) {
      updateData.file_name = file_name || fileRecord.file_name;
      updateData.file_name_original = finalFileName;
      updateData.storage_path = finalStoragePath;
      updateData.share_url = finalShareUrl;
      updateData.file_url = finalShareUrl;
    }

    if (netsuite_id) {
      updateData.netsuite_id = netsuite_id;
    }

    if (created_by_api !== undefined) {
      updateData.created_by_api = created_by_api || userEmail || null;
    }

    updateData.updated_by = userId;

    if (Object.keys(updateData).length > 0) {
      // Use the DB primary id when updating (req.params.id is netsuite_id in this route)
      await service.updateFileRecord(fileRecord.id, updateData);
    }

    // Notify bridge API (non-blocking)
    if (fileRecord.netsuite_file_id) {
      const bridgeResult = await service.callBridgeUpdate({
        bridgeId: fileRecord.netsuite_file_id,
        fileName: file_name,
        fileUrl: finalShareUrl
      });

      // Trigger sync hanya jika callBridgeCreate berhasil (non-blocking)
      if (bridgeResult) {
        const userToken = (req.headers.authorization || '').replace('Bearer ', '');
        if (userToken) {
          triggerSync({
            type: type || fileRecord.transaction_type,
            netsuite_id: netsuite_id || fileRecord.netsuite_id,
            token: userToken
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'File record updated successfully',
      data: {
        id: id || null,
        netsuiteId: netsuite_id || null,
        fileUrl: finalShareUrl || fileUrl || null,
        fileName: file_name
      }
    });

  } catch (error) {
    console.error('Error updating file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update file',
      error: error.message
    });
  }
};

const destroy = async (req, res) => {
  try {
    const { id, netsuite_id } = req.params;

    const fileRecord = await service.getFileRecordByNetsuiteFileId(id);

    if (!fileRecord) {
      try {
        const bridgeResult = await service.callBridgeDelete(id);
        if (bridgeResult) {
          const userToken = (req.headers.authorization || '').replace('Bearer ', '');
          if (userToken) {
            triggerSync({
              type: 'purchase_order',
              netsuite_id: netsuite_id || id,
              token: userToken
            });
          }
        }
      } catch (notifyErr) {
        console.warn('Bridge delete notification failed:', notifyErr?.message || notifyErr);
      }

      return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    }

    if (typeof fileRecord?.storage_path === 'string' && fileRecord.storage_path) {
      try {
        const exists = await nextcloud.client.exists(fileRecord.storage_path);
        if (exists) {
          await nextcloud.client.deleteFile(fileRecord.storage_path);
        }
      } catch (ncError) {
        console.error(`Failed to delete file from Nextcloud:`, ncError.message);
      }
    }

    await service.deleteFileRecord(fileRecord.id);

    // Notify bridge API (non-blocking)
    if (fileRecord.netsuite_file_id) {
      const bridgeResult = await service.callBridgeDelete(fileRecord.netsuite_file_id);
      // Trigger sync hanya jika callBridgeCreate berhasil (non-blocking)
      if (bridgeResult) {
        const userToken = (req.headers.authorization || '').replace('Bearer ', '');
        if (userToken) {
          triggerSync({
            type: fileRecord.transaction_type,
            netsuite_id: netsuite_id || fileRecord.netsuite_id,
            token: userToken
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
};

module.exports = {
  getList,
  create,
  update,
  destroy
};
