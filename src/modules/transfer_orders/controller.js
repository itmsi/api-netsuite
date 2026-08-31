const service = require("./service");
const syncService = require("../sync/service");
const { baseResponse, decodeToken } = require("../../utils");
const nextcloud = require("../../utils/nextcloud");
const path = require("path");

/**
 * Get transfer orders list
 */
const getList = async (req, res) => {
  try {
    const result = await service.getTransferOrders(req.body);

    const syncInfo = await syncService
      .getLatestSyncInfo("transfer_orders")
      .catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: "Data transfer orders berhasil diambil",
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
      errors: error.errors || error,
    });
  }
};

/**
 * Get transfer orders list
 */
const getListMobile = async (req, res) => {
  try {
    const result = await service.getMobileTransferOrders(req.body);

    const syncInfo = await syncService
      .getLatestSyncInfo("transfer_orders")
      .catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: "Data transfer orders berhasil diambil",
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
      errors: error.errors || error,
    });
  }
};

/**
 * Get transfer order by ID (id lokal UUID atau netsuite_id)
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Parameter id tidak boleh kosong" });
    }

    let result;
    try {
      result = await service.getTransferOrderById(id);
    } catch (error) {
      if (error.statusCode !== 404) throw error;

      // Data tidak ditemukan di DB lokal, sync dulu ke netsuite lalu cek ulang
      await service.syncTransferOrderToBridge(id);
      result = await service.getTransferOrderById(id);
    }

    const to = result.data;

    return res.status(200).json({
      success: true,
      message: "",
      data: to ? [to] : [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
      errors: error.errors || error,
    });
  }
};

/**
 * Sync transfer order by ID (id lokal UUID atau netsuite_id) dari bridge API
 */
const syncById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Parameter id tidak boleh kosong" });
    }

    const result = await service.syncTransferOrderById(id);

    await syncService.upsertSync(
      { sync_module: "transfer_orders", sync_status: "success" },
      req.user,
    );

    const syncInfo = await syncService
      .getLatestSyncInfo("transfer_orders")
      .catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: `Transfer order ID ${id} berhasil di-sync dari bridge API`,
      },
    });
  } catch (error) {
    await syncService
      .upsertSync(
        { sync_module: "transfer_orders", sync_status: "failed" },
        req.user,
      )
      .catch(() => {});

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
      errors: error.errors || error,
    });
  }
};

/**
 * Create new transfer order
 */
const create = async (req, res) => {
  try {
    // Automate fields
    if (req.user && req.user.email) {
      req.body.custbody_msi_createdby_api = req.user.email;
    }

    const createdPayload = decodeToken("created", req);
    const userId =
      createdPayload.created_by ||
      req.user?.employee_id ||
      req.user?.user_id ||
      req.user?.id ||
      req.user?.sub ||
      null;

    const result = await service.createTransferOrder(
      req.body,
      req.user,
      userId,
    );
    return res.status(201).json({
      success: true,
      data: {
        success: true,
        localId: result.data.toId,
        // local_id: result.data.event_id
      },
      message: "Transfer order berhasil dibuat",
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
      errors: error.errors || error,
    });
  }
};

/**
 * Update transfer order
 */
const update = async (req, res) => {
  try {
    // Automate fields
    if (req.user && req.user.email) {
      req.body.custbody_msi_createdby_api = req.user.email;
    }

    const updatedPayload = decodeToken("updated", req);
    const userId =
      updatedPayload.updated_by ||
      updatedPayload.update_by ||
      decodeToken("created", req).created_by ||
      req.user?.employee_id ||
      req.user?.user_id ||
      req.user?.id ||
      req.user?.sub ||
      null;

    const result = await service.updateTransferOrder(
      req.body,
      req.user,
      userId,
    );
    return res.status(200).json({
      success: true,
      data: {
        success: true,
        localId: result.data.toId,
        // local_id: result.data.event_id
      },
      message: "Transfer order update berhasil diinisiasi",
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
      errors: error.errors || error,
    });
  }
};

/**
 * Upload file to Nextcloud Temp Directory
 * @route POST /api/transfer-orders/upload
 */
const uploadTempFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const { netsuite_id, file_name } = req.body;

    const extension = path.extname(file.originalname);

    let baseName = file_name || file.originalname;
    if (path.extname(baseName)) {
      baseName = path.basename(baseName, path.extname(baseName));
    }

    const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, "_");

    const fileName = `${Date.now()}_${normalizedBaseName}${extension}`;
    const uploadDir = nextcloud.NEXTCLOUD_UPLOAD_DIR;
    const filePath = `${uploadDir}/${fileName}`;

    await nextcloud.ensureDirectoryExists(uploadDir);

    await nextcloud.client.putFileContents(filePath, file.buffer);

    const shareUrl = await nextcloud.generateShareLink(filePath);

    // Jika netsuite_id disediakan, simpan ke DB sekarang, jika tidak tunggu finalize
    let result = {};
    if (netsuite_id) {
      result = await service.saveFileRecord({
        netsuite_id,
        file_name: fileName,
        file_name_original: file_name,
        storage_provider: "nextcloud",
        storage_path: filePath,
        share_url: shareUrl,
      });
    }

    return res.status(200).json({
      success: true,
      id: result?.id || null,
      netsuiteId: netsuite_id || null,
      fileUrl: shareUrl,
      storagePath: filePath,
      fileName: file_name,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload file to Nextcloud",
      error: error.message,
    });
  }
};

/**
 * Finalize file upload by moving from temp to transfer order folder
 * @route POST /api/transfer-orders/upload/finalize
 */
const finalizeUpload = async (req, res) => {
  try {
    const { netsuite_id, storage_path } = req.body;

    if (!netsuite_id || !storage_path) {
      return res.status(400).json({
        success: false,
        message: "netsuite_id and storage_path are required",
      });
    }

    const fileName = path.basename(storage_path);
    const year = new Date().getFullYear();
    const finalDir = `/uploads/to/${year}/${netsuite_id}`;
    const finalPath = `${finalDir}/${fileName}`;

    await nextcloud.ensureDirectoryExists(finalDir);

    await nextcloud.client.moveFile(storage_path, finalPath);

    // Share link tidak di-regenerate, tetapi DB perlu diupdate
    await service.updateFileRecord(storage_path, finalPath, null);

    return res.status(200).json({
      success: true,
      path: finalPath,
    });
  } catch (error) {
    console.error("Error finalizing upload:", error);
    return res.status(500).json({
      success: false,
      path: null,
      message: "Failed to finalize file upload",
      error: error.message,
    });
  }
};

/**
 * Delete file by share_url from local database and Nextcloud
 * @route POST /api/transfer-orders/upload-delete
 */
const deleteUpload = async (req, res) => {
  try {
    const { fileUrl } = req.body;
    if (!fileUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Parameter fileUrl is required" });
    }

    const fileRecord = await service.getFileRecordByShareUrl(fileUrl);
    if (!fileRecord) {
      // Jika file tidak ada dianggap sukses saja, karena file bisa saja masuk langsung dari NetSuite
      return res.status(200).json({
        success: true,
        message: "File deleted successfully",
      });
    }

    try {
      const exists = await nextcloud.client.exists(fileRecord.storage_path);
      if (exists) {
        await nextcloud.client.deleteFile(fileRecord.storage_path);
        console.info(
          `[Controller] Deleted file from Nextcloud: ${fileRecord.storage_path}`,
        );
      } else {
        console.warn(
          `[Controller] File not found in Nextcloud at path: ${fileRecord.storage_path}`,
        );
      }
    } catch (ncError) {
      console.error(
        `[Controller] Failed to delete file from Nextcloud:`,
        ncError.message,
      );
    }

    await service.deleteFileRecord(fileRecord.id);

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting uploaded file:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete file",
      error: error.message,
    });
  }
};

/**
 * Update or create uploaded file by share_url (either replacement file, new file_name, or both)
 * If the file does not exist by share_url, it creates a new record using the provided netsuite_id.
 * @route POST /api/transfer-orders/upload-update
 */
const updateUpload = async (req, res) => {
  try {
    const { fileUrl, file_name, netsuite_id } = req.body;
    const file = req.file;

    if (!fileUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Parameter fileUrl is required" });
    }

    const fileRecord = await service.getFileRecordByShareUrl(fileUrl);

    if (!fileRecord) {
      // SCENARIO C: File tidak ada, CREATE record baru langsung di folder NetSuite Transfer Order
      if (!file) {
        return res.status(400).json({
          success: false,
          message:
            "File record not found for the provided fileUrl, and no new file was uploaded to create a new record.",
        });
      }

      if (!netsuite_id) {
        return res.status(400).json({
          success: false,
          message: "netsuite_id is required to create a new file record.",
        });
      }

      let folderName = netsuite_id;
      try {
        const toRecord =
          await service.getTransferOrderByNetsuiteId(netsuite_id);
        if (toRecord && toRecord.tranid) {
          folderName = toRecord.tranid;
          console.info(
            `[Controller] Found tranid: ${folderName} for netsuite_id: ${netsuite_id}`,
          );
        }
      } catch (dbErr) {
        console.warn(
          `[Controller] Error fetching tranid for new upload:`,
          dbErr.message,
        );
      }

      const year = new Date().getFullYear();
      const finalDir = `/NetSuite/TransferOrders/${year}/${folderName}`;

      await nextcloud.ensureDirectoryExists(finalDir);

      const extension = path.extname(file.originalname);
      let baseName = file_name || file.originalname;
      if (path.extname(baseName)) {
        baseName = path.basename(baseName, path.extname(baseName));
      }
      const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, "_");
      const finalFileName = `${Date.now()}_${normalizedBaseName}${extension}`;
      const finalStoragePath = `${finalDir}/${finalFileName}`;

      await nextcloud.client.putFileContents(finalStoragePath, file.buffer);

      let finalShareUrl = "";
      try {
        finalShareUrl = await nextcloud.generateShareLink(finalStoragePath);
      } catch (shareErr) {
        console.warn(
          `[Controller] Failed to generate share link for new file:`,
          shareErr.message,
        );
      }

      const newRecord = await service.saveFileRecord({
        netsuite_id: netsuite_id,
        file_name: finalFileName,
        file_name_original: file_name || file.originalname,
        storage_provider: "nextcloud",
        storage_path: finalStoragePath,
        share_url: finalShareUrl,
      });

      return res.status(200).json({
        success: true,
        message: "File created successfully",
        data: {
          id: newRecord.id,
          netsuiteId: newRecord.netsuite_id,
          fileUrl: newRecord.share_url,
          storagePath: newRecord.storage_path,
          fileName: newRecord.file_name_original,
        },
      });
    }

    // SCENARIO A & B: File sudah ada, lakukan UPDATE
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
      } catch (ncErr) {
        console.warn(
          `[Controller] Could not delete old file in Nextcloud: ${oldStoragePath}`,
          ncErr.message,
        );
      }

      const extension = path.extname(file.originalname);
      let baseName = file_name || file.originalname;
      if (path.extname(baseName)) {
        baseName = path.basename(baseName, path.extname(baseName));
      }
      const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, "_");
      finalFileName = `${Date.now()}_${normalizedBaseName}${extension}`;
      finalOriginalName = file_name || file.originalname;
      finalStoragePath = `${parentDir}/${finalFileName}`;

      await nextcloud.client.putFileContents(finalStoragePath, file.buffer);

      try {
        finalShareUrl = await nextcloud.generateShareLink(finalStoragePath);
      } catch (shareErr) {
        console.warn(
          `[Controller] Failed to generate new share link:`,
          shareErr.message,
        );
      }
    } else if (file_name) {
      const extension = path.extname(fileRecord.file_name);
      let baseName = file_name;
      if (path.extname(baseName)) {
        baseName = path.basename(baseName, path.extname(baseName));
      }
      const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, "_");
      finalFileName = `${Date.now()}_${normalizedBaseName}${extension}`;
      finalOriginalName = file_name;
      finalStoragePath = `${parentDir}/${finalFileName}`;

      try {
        const oldExists = await nextcloud.client.exists(oldStoragePath);
        if (oldExists) {
          await nextcloud.client.moveFile(oldStoragePath, finalStoragePath);
        }
      } catch (ncErr) {
        console.error(
          `[Controller] Failed to rename file in Nextcloud:`,
          ncErr.message,
        );
        return res.status(500).json({
          success: false,
          message: "Failed to rename file in Nextcloud",
          error: ncErr.message,
        });
      }

      try {
        finalShareUrl = await nextcloud.generateShareLink(finalStoragePath);
      } catch (shareErr) {
        console.warn(
          `[Controller] Failed to generate new share link for renamed file:`,
          shareErr.message,
        );
      }
    }

    const updatedRecord = await service.updateFileRecordFields(fileRecord.id, {
      file_name: finalFileName,
      file_name_original: finalOriginalName,
      storage_path: finalStoragePath,
      share_url: finalShareUrl,
    });

    return res.status(200).json({
      success: true,
      message: "File updated successfully",
      data: {
        id: updatedRecord.id,
        netsuiteId: updatedRecord.netsuite_id,
        fileUrl: updatedRecord.share_url,
        storagePath: updatedRecord.storage_path,
        fileName: updatedRecord.file_name_original,
      },
    });
  } catch (error) {
    console.error("Error updating/creating uploaded file:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update/create file",
      error: error.message,
    });
  }
};

module.exports = {
  getList,
  getListMobile,
  getById,
  syncById,
  create,
  update,
  uploadTempFile,
  finalizeUpload,
  deleteUpload,
  updateUpload,
};
