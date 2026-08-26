const service = require("./service");
const syncService = require("../sync/service");
const { baseResponse } = require("../../utils");

/**
 * Get items list (dari DB)
 */
const getList = async (req, res) => {
  try {
    const result = await service.getItemsList(req.body);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Data items berhasil diambil",
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
 * Sync items dari bridge API
 */
const sync = async (req, res) => {
  try {
    const result = await service.syncItemsList(req.body);

    await syncService.createSync(
      { sync_module: "items", sync_status: "success" },
      req.user,
    );

    const syncInfo = await syncService
      .getLatestSyncInfo("items")
      .catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: "Data items berhasil di-sync dari bridge API",
      },
    });
  } catch (error) {
    await syncService
      .createSync({ sync_module: "items", sync_status: "failed" }, req.user)
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
 * Sync single item by ID dari bridge API
 */
const syncById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Parameter id tidak boleh kosong" });
    }

    await service.syncItemById(id);

    const result = await service.getItemByNetsuiteId(id);

    // await syncService.upsertSync(
    //   { sync_module: "items", sync_status: "success" },
    //   req.user
    // );

    // const syncInfo = await syncService
    //   .getLatestSyncInfo("items")
    //   .catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        // sync_info: syncInfo,
        message: `Item ID ${id} berhasil di-sync dari bridge API`,
      },
    });
  } catch (error) {
    await syncService
      .upsertSync({ sync_module: "items", sync_status: "failed" }, req.user)
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
 * Get item locations
 */
const getItemLocation = async (req, res) => {
  try {
    const result = await service.getItemLocation(req.body);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Data item locations berhasil diambil",
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
 * Get receipts from local receives table
 */
const getItemReceipts = async (req, res) => {
  try {
    const result = await service.getItemReceipts(req.body);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Data receipts berhasil diambil",
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
 * Get receipt detail by id from local receives table
 */
const getItemReceiptById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Parameter id tidak boleh kosong",
      });
    }

    const result = await service.getItemReceiptById(id);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Data receipt berhasil diambil",
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
 * Create item receipt/fulfillment (multipart/form-data, dengan lampiran file opsional)
 * via bridge API secara asynchronous menggunakan queue + listener.
 */
const createFulfillmentReceipts = async (req, res) => {
  try {
    const { function_type, transaction_type, transaction_id, items } =
      req.body;

    let parsedItems = items;
    if (typeof items === "string") {
      try {
        parsedItems = JSON.parse(items);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Format items tidak valid, harus berupa JSON array",
        });
      }
    }

    const result = await service.createFulfillmentReceipts(
      {
        function_type,
        transaction_type,
        transaction_id,
        items: parsedItems,
        file: req.file,
      },
      req.user,
    );

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message:
          function_type === "receipts"
            ? "Item receipt sedang diproses"
            : "Item fulfillment sedang diproses",
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
  sync,
  syncById,
  getItemLocation,
  getItemReceipts,
  getItemReceiptById,
  createFulfillmentReceipts,
};
