const service = require("./service");
const syncService = require("../sync/service");
const { baseResponse } = require("../../utils");

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
        message: "Detail data bill payment berhasil diambil",
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Data bill payment tidak ditemukan",
      errors: error.errors || error,
    });
  }
};

/**
 * Get bill payments list (dari DB)
 */
const getList = async (req, res) => {
  try {
    const result = await service.getBillPaymentList(req.body);
    const syncInfo = await syncService
      .getLatestSyncInfo("bill_payments")
      .catch(() => null);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: "Data bill payments berhasil diambil",
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
 * Force sync satu bill payment by netsuite_id dari bridge API
 */
const syncById = async (req, res) => {
  try {
    const { netsuite_id } = req.params;
    const result = await service.syncBillPaymentById(netsuite_id);

    await syncService.createSync(
      { sync_module: "bill_payments", sync_status: "success" },
      req.user,
    );

    const syncInfo = await syncService
      .getLatestSyncInfo("bill_payments")
      .catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: `Bill payment netsuite_id ${netsuite_id} berhasil di-sync dari bridge API`,
      },
    });
  } catch (error) {
    await syncService
      .createSync(
        { sync_module: "bill_payments", sync_status: "failed" },
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
 * Get bill payment attachments list (dari DB)
 */
const getAttachmentFiles = async (req, res) => {
  try {
    const result = await service.getAttachmentFileList(req.body || {});
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Data bill payment attachments berhasil diambil",
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
 * Sync daftar attachment satu bill payment dari bridge API
 */
const syncAttachmentFiles = async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "id (netsuite_id bill payment) is required",
      });
    }

    const result = await service.syncAttachmentFiles(id);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: `Attachments bill payment netsuite_id ${id} berhasil di-sync dari bridge API`,
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
 * Convert satu file attachment bill payment via bridge API
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
        message: `File ${file_netsuite_id} bill payment netsuite_id ${id} sedang diproses convert`,
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
 * Get link download file attachment bill payment dari bridge API
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
