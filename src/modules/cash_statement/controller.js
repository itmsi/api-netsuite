const service = require("./service");
const syncService = require("../sync/service");
const { baseResponse } = require("../../utils");

const SYNC_MODULE = "cash_statements";

const sendError = (res, error, fallbackMessage = "Internal Server Error") => {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || fallbackMessage,
    errors: error.errors || error,
  });
};

/**
 * Get cash statements (detail + summary) dari DB
 */
const getList = async (req, res) => {
  try {
    const result = await service.getCashStatementList(req.body || {});
    const syncInfo = await syncService.getLatestSyncInfo(SYNC_MODULE).catch(() => null);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: "Data cash statements berhasil diambil",
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * Get cash statement detail by ID (UUID)
 */
const getById = async (req, res) => {
  try {
    const result = await service.getCashStatementById(req.params.id);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Detail data cash statement berhasil diambil",
      },
    });
  } catch (error) {
    return sendError(res, { ...error, statusCode: error.statusCode || 404 }, "Data cash statement tidak ditemukan");
  }
};

/**
 * Get summary saldo per akun per saved search dari DB
 */
const getSummary = async (req, res) => {
  try {
    const result = await service.getSummaryList(req.body || {});
    return baseResponse(res, {
      data: {
        success: true,
        data: { items: result, total: result.length },
        message: "Data summary cash statement berhasil diambil",
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * Sync cash statement dari NetSuite via bridge API
 * Body: { search_id?, full?, date? }
 */
const sync = async (req, res) => {
  try {
    const result = await service.syncCashStatements(req.body || {});

    await syncService.createSync({ sync_module: SYNC_MODULE, sync_status: "success" }, req.user);
    const syncInfo = await syncService.getLatestSyncInfo(SYNC_MODULE).catch(() => null);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        sync_info: syncInfo,
        message: "Cash statement berhasil di-sync dari bridge API",
      },
    });
  } catch (error) {
    await syncService
      .createSync({ sync_module: SYNC_MODULE, sync_status: "failed" }, req.user)
      .catch(() => {});
    return sendError(res, error);
  }
};

/**
 * Force sync satu transaksi by netsuite_id via bridge API
 */
const syncById = async (req, res) => {
  try {
    const { netsuite_id } = req.params;
    if (!netsuite_id || isNaN(parseInt(netsuite_id))) {
      return res.status(400).json({ success: false, message: "netsuite_id tidak valid" });
    }

    const result = await service.syncCashStatementByNetsuiteId(netsuite_id);

    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: `Cash statement netsuite_id ${netsuite_id} berhasil di-sync dari bridge API`,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * Get daftar saved search Cash Statement dari DB
 */
const getSearches = async (req, res) => {
  try {
    const result = await service.getSearchList(req.body || {});
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Data saved search cash statement berhasil diambil",
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * Tambah saved search via bridge API
 * Body: { search_ids: [466, "customsearch_x"], name?, description? } | { items: [...] } | { search_id, ... }
 */
const createSearches = async (req, res) => {
  try {
    const body = req.body || {};
    const hasInput =
      (Array.isArray(body.items) && body.items.length > 0) ||
      (Array.isArray(body.search_ids) && body.search_ids.length > 0) ||
      (body.search_id !== undefined && body.search_id !== null && String(body.search_id).trim() !== "");

    if (!hasInput) {
      return res.status(400).json({
        success: false,
        message: "search_id / search_ids is required",
      });
    }

    const result = await service.createSearches(body);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Saved search cash statement berhasil disimpan",
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * Ubah saved search via bridge API
 */
const updateSearch = async (req, res) => {
  try {
    const result = await service.updateSearch(req.params.id, req.body || {});
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Saved search cash statement berhasil diubah",
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/**
 * Hapus saved search via bridge API
 */
const deleteSearch = async (req, res) => {
  try {
    const result = await service.deleteSearch(req.params.id);
    return baseResponse(res, {
      data: {
        success: true,
        data: result,
        message: "Saved search cash statement berhasil dihapus",
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getList,
  getById,
  getSummary,
  sync,
  syncById,
  getSearches,
  createSearches,
  updateSearch,
  deleteSearch,
};
