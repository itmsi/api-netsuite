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

module.exports = {
  getList,
  getById,
  syncById,
};
