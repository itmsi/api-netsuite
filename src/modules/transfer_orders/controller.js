const service = require("./service");
const syncService = require("../sync/service");
const { baseResponse, decodeToken } = require("../../utils");

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

    const result = await service.getTransferOrderById(id);
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

module.exports = {
  getList,
  getById,
  syncById,
  create,
  update,
};
