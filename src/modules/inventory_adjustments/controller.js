const service = require("./service");
const syncService = require("../sync/service");
const { baseResponse } = require("../../utils");

/**
 * Get inventory adjustments list (dari DB)
 */
const getList = async (req, res) => {
  try {
    const result = await service.getInventoryAdjustmentsList(req.body);
    const syncInfo = await syncService
      .getLatestSyncInfo("inventory_adjustments")
      .catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: "Data inventory adjustments berhasil diambil",
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
 * Get inventory adjustment detail by id (UUID) atau netsuite_id (string)
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Parameter id tidak boleh kosong",
      });
    }

    const result = await service.getInventoryAdjustmentById(id);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Data inventory adjustment berhasil diambil",
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
 * Sync inventory adjustment by id dari bridge API, lalu ambil data terbaru dari local database
 */
const syncById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Parameter id tidak boleh kosong",
      });
    }

    await service.syncInventoryAdjustmentById(id);

    const result = await service.getInventoryAdjustmentById(id);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: `Inventory adjustment ID ${id} berhasil di-sync dari bridge API`,
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
 * Create inventory adjustment via bridge API
 */
const create = async (req, res) => {
  try {
    const result = await service.createInventoryAdjustment(req.body, req.user);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Inventory adjustment berhasil dibuat",
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

module.exports = {
  getList,
  getById,
  syncById,
  create,
};
