const service = require("./service");
const syncService = require("../sync/service");
const { baseResponse } = require("../../utils");

const SYNC_MODULE = "vendor_prepayments";

/**
 * Get vendor prepayment detail by ID / netsuite_id (dari DB)
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await service.getVendorPrepaymentById(id);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Detail data vendor prepayment berhasil diambil",
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Data vendor prepayment tidak ditemukan",
      errors: error.errors || error,
    });
  }
};

/**
 * Get vendor prepayments list (dari DB)
 */
const getList = async (req, res) => {
  try {
    const result = await service.getVendorPrepaymentList(req.body);
    const syncInfo = await syncService
      .getLatestSyncInfo(SYNC_MODULE)
      .catch(() => null);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: "Data vendor prepayments berhasil diambil",
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
 * Force sync satu vendor prepayment by netsuite_id dari bridge API
 */
const syncById = async (req, res) => {
  try {
    const { netsuite_id } = req.params;
    const result = await service.syncVendorPrepaymentById(netsuite_id);

    await syncService.upsertSync(
      { sync_module: SYNC_MODULE, sync_status: "success" },
      req.user,
    );

    const syncInfo = await syncService
      .getLatestSyncInfo(SYNC_MODULE)
      .catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: `Vendor prepayment netsuite_id ${netsuite_id} berhasil di-sync dari bridge API`,
      },
    });
  } catch (error) {
    await syncService
      .upsertSync(
        { sync_module: SYNC_MODULE, sync_status: "failed" },
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
 * Get vendor prepayment attachments list (dari DB)
 */
const getAttachmentFiles = async (req, res) => {
  try {
    const result = await service.getAttachmentFileList(req.body || {});
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Data vendor prepayment attachments berhasil diambil",
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
 * Sync daftar attachment satu vendor prepayment dari bridge API
 */
const syncAttachmentFiles = async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "id (netsuite_id vendor prepayment) is required",
      });
    }

    const result = await service.syncAttachmentFiles(id);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: `Attachments vendor prepayment netsuite_id ${id} berhasil di-sync dari bridge API`,
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
 * Convert satu file attachment vendor prepayment via bridge API
 */
const syncAttachmentFileById = async (req, res) => {
  try {
    const { id } = req.params;
    const { file_netsuite_id } = req.body || {};
    if (
      file_netsuite_id === undefined ||
      file_netsuite_id === null ||
      String(file_netsuite_id).trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "file_netsuite_id is required",
      });
    }

    const result = await service.syncAttachmentFileById(id, file_netsuite_id);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: `File ${file_netsuite_id} vendor prepayment netsuite_id ${id} sedang diproses convert`,
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
 * Get link download file attachment vendor prepayment dari bridge API
 */
const downloadAttachmentFile = async (req, res) => {
  try {
    const data = await service.downloadAttachmentFile(
      req.params.file_netsuite_id,
    );
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      success: true,
      message: "Download link retrieved successfully",
      data,
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

module.exports = {
  getList,
  getById,
  syncById,
  getAttachmentFiles,
  syncAttachmentFiles,
  syncAttachmentFileById,
  downloadAttachmentFile,
};
