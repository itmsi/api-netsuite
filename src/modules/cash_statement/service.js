const axios = require("axios");
const authService = require("../auth/service");

const { dbNetsuite } = require("../../config/database");

const toArray = (val) => [].concat(val).filter((v) => v !== undefined && v !== null && v !== "");

/**
 * Panggil bridge API cash-statements dengan token auth.
 * Bridge membalas error dengan HTTP 200 + success:false, jadi dicek manual.
 */
const callBridge = async (method, path, payload, defaultErrorMessage) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl = process.env.BRIDGE_BASE_URL || "http://localhost:9570";
    const url = `${baseUrl}/api/v1/bridge/cash-statements${path}`;

    const response = await axios.request({
      method,
      url,
      data: payload,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // Sync bisa lama (banyak saved search, banyak halaman)
      timeout: 1500000,
    });

    if (response.data?.success === false) {
      throw {
        message: response.data.message || defaultErrorMessage,
        statusCode: 400,
        errors: response.data,
      };
    }

    return response.data?.data ?? response.data;
  } catch (error) {
    if (error.statusCode) throw error;
    if (error.response) {
      throw {
        message: error.response.data?.message || defaultErrorMessage,
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

/* ───────────────────────── Detail (DB) ───────────────────────── */

const DETAIL_SELECT = [
  "id",
  "search_id",
  "netsuite_id",
  "line",
  "account",
  "account_display",
  "type",
  "type_display",
  "tranid",
  dbNetsuite.raw("to_char(trandate, 'YYYY-MM-DD') as trandate"),
  "postingperiod",
  "postingperiod_display",
  "status",
  "status_display",
  "entity",
  "entity_display",
  "memo",
  "subsidiary",
  "subsidiary_display",
  "department",
  "department_display",
  "class",
  "class_display",
  "location",
  "location_display",
  "currency",
  "currency_display",
  "debitamount",
  "creditamount",
  "amount",
  "datecreated_netsuite",
  "last_modified_netsuite",
  "created_at",
  "updated_at",
  "is_deleted",
];

const VALID_SORT_COLUMNS = [
  "id",
  "search_id",
  "netsuite_id",
  "account",
  "account_display",
  "type",
  "tranid",
  "trandate",
  "debitamount",
  "creditamount",
  "amount",
  "last_modified_netsuite",
  "created_at",
  "updated_at",
];

/**
 * Filter bersama untuk list & summary
 */
const applySearchAccountFilters = (query, body, table = "") => {
  const col = (name) => (table ? `${table}.${name}` : name);

  const searchIds = toArray(body.search_id).map(String);
  if (searchIds.length > 0) {
    query.whereIn(col("search_id"), searchIds);
  }

  const accounts = toArray(body.account).map((v) => parseInt(v)).filter((v) => !isNaN(v));
  if (accounts.length > 0) {
    query.whereIn(col("account"), accounts);
  }
  return query;
};

/**
 * Get cash statements (detail) + summary dari DB Netsuite (bridge_sanbox.cash_statements)
 */
const getCashStatementList = async (body) => {
  try {
    const page = body.page !== undefined ? parseInt(body.page) : 1;
    const limit = parseInt(body.page_size) || parseInt(body.limit) || 20;
    const sortOrder = body.sort_order && String(body.sort_order).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const offset = (page - 1 < 0 ? 0 : page - 1) * limit;

    const sortByRaw = body.sort_by || "trandate";
    const orderCol = VALID_SORT_COLUMNS.includes(sortByRaw) ? sortByRaw : "trandate";

    let query = dbNetsuite("cash_statements").where(
      "is_deleted",
      body.is_deleted !== undefined ? body.is_deleted : false,
    );
    query = applySearchAccountFilters(query, body);

    const netsuiteIds = toArray(body.netsuite_id).map((v) => parseInt(v)).filter((v) => !isNaN(v));
    if (netsuiteIds.length > 0) {
      query = query.whereIn("netsuite_id", netsuiteIds);
    }
    const types = toArray(body.type).map(String);
    if (types.length > 0) {
      query = query.whereIn("type", types);
    }
    if (body.tranid) {
      query = query.whereILike("tranid", `%${body.tranid}%`);
    }
    if (body.subsidiary) {
      query = query.where("subsidiary", body.subsidiary);
    }
    if (body.department) {
      query = query.where("department", body.department);
    }
    if (body.location) {
      query = query.where("location", body.location);
    }
    if (body.trandate_from) {
      query = query.where("trandate", ">=", body.trandate_from);
    }
    if (body.trandate_to) {
      query = query.where("trandate", "<=", body.trandate_to);
    }
    if (body.search) {
      query = query.where(function () {
        this.whereILike("tranid", `%${body.search}%`)
          .orWhereILike("memo", `%${body.search}%`)
          .orWhereILike("account_display", `%${body.search}%`)
          .orWhereILike("entity_display", `%${body.search}%`)
          .orWhereRaw("CAST(netsuite_id AS TEXT) ILIKE ?", [`%${body.search}%`]);
      });
    }

    const countResult = await query.clone().count("id as total").first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const items = await query
      .clone()
      .select(DETAIL_SELECT)
      .orderBy(orderCol, sortOrder)
      .orderBy("netsuite_id", "desc")
      .orderBy("line", "asc")
      .limit(limit)
      .offset(offset);

    const summary = await getSummaryList(body);

    return {
      items,
      summary,
      pagination: { page, limit, total, totalPages },
    };
  } catch (error) {
    throw {
      message: error.message || "Failed to fetch cash statements from database",
      statusCode: 500,
    };
  }
};

/**
 * Get single cash statement by ID (UUID) dari DB Netsuite
 */
const getCashStatementById = async (id) => {
  try {
    const row = await dbNetsuite("cash_statements").select(DETAIL_SELECT).where({ id }).first();

    if (!row) {
      throw { message: "Data cash statement tidak ditemukan", statusCode: 404 };
    }
    return row;
  } catch (error) {
    if (error.statusCode) throw error;
    throw {
      message: error.message || "Failed to fetch cash statement from database",
      statusCode: 500,
    };
  }
};

/* ───────────────────────── Summary (DB) ───────────────────────── */

/**
 * Get summary saldo per akun per saved search dari DB Netsuite
 * Filter: search_id, account (scalar atau array)
 */
const getSummaryList = async (body = {}) => {
  try {
    const query = dbNetsuite("cash_statement_summaries").select([
      "search_id",
      "account",
      "account_display",
      "amount",
      dbNetsuite.raw("to_char(as_of_date, 'YYYY-MM-DD') as as_of_date"),
      "synced_at",
    ]);
    applySearchAccountFilters(query, body);

    return await query.orderBy("search_id", "asc").orderBy("account_display", "asc");
  } catch (error) {
    throw {
      message: error.message || "Failed to fetch cash statement summary from database",
      statusCode: 500,
    };
  }
};

/* ───────────────────────── Saved search (DB + bridge) ───────────────────────── */

/**
 * Get daftar saved search Cash Statement dari DB Netsuite
 */
const getSearchList = async (body = {}) => {
  try {
    const page = body.page !== undefined ? parseInt(body.page) : 1;
    const limit = parseInt(body.page_size) || parseInt(body.limit) || 50;
    const offset = (page - 1 < 0 ? 0 : page - 1) * limit;

    let query = dbNetsuite("cash_statement_searches").where("is_deleted", false);

    if (body.is_active !== undefined && body.is_active !== null) {
      query = query.where("is_active", body.is_active === true || body.is_active === "true");
    }
    const searchIds = toArray(body.search_id).map(String);
    if (searchIds.length > 0) {
      query = query.whereIn("search_id", searchIds);
    }
    if (body.search) {
      query = query.where(function () {
        this.whereILike("search_id", `%${body.search}%`).orWhereILike("name", `%${body.search}%`);
      });
    }

    const countResult = await query.clone().count("id as total").first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const items = await query
      .clone()
      .select([
        "id",
        "search_id",
        "name",
        "description",
        "is_active",
        "last_synced_at",
        "last_sync_status",
        "last_sync_message",
        "created_at",
        "updated_at",
      ])
      .orderBy("created_at", "asc")
      .orderBy("search_id", "asc")
      .limit(limit)
      .offset(offset);

    return { items, pagination: { page, limit, total, totalPages } };
  } catch (error) {
    throw {
      message: error.message || "Failed to fetch cash statement searches from database",
      statusCode: 500,
    };
  }
};

/**
 * Tambah saved search — hit bridge API POST /cash-statements/searches
 */
const createSearches = async (payload) =>
  callBridge("post", "/searches", payload, "Failed to create cash statement searches via bridge API");

/**
 * Ubah saved search — hit bridge API PUT /cash-statements/searches/:id
 */
const updateSearch = async (id, payload) =>
  callBridge("put", `/searches/${encodeURIComponent(id)}`, payload, `Failed to update cash statement search ${id} via bridge API`);

/**
 * Hapus saved search — hit bridge API DELETE /cash-statements/searches/:id
 */
const deleteSearch = async (id) =>
  callBridge("delete", `/searches/${encodeURIComponent(id)}`, undefined, `Failed to delete cash statement search ${id} via bridge API`);

/* ───────────────────────── Sync (bridge) ───────────────────────── */

/**
 * Sync cash statement dari NetSuite — hit bridge API POST /cash-statements/sync
 * Body: { search_id?, full?, date? }
 */
const syncCashStatements = async (body = {}) => {
  const payload = {};
  if (body.search_id !== undefined) payload.search_id = body.search_id;
  if (body.full !== undefined) payload.full = body.full;
  if (body.date !== undefined) payload.date = body.date;

  return callBridge("post", "/sync", payload, "Failed to sync cash statements from bridge API");
};

/**
 * Force sync satu transaksi by netsuite_id — hit bridge API GET /cash-statements/sync/:netsuite_id
 */
const syncCashStatementByNetsuiteId = async (netsuiteId) =>
  callBridge(
    "get",
    `/sync/${parseInt(netsuiteId)}`,
    undefined,
    `Failed to sync cash statement netsuite_id ${netsuiteId} from bridge API`,
  );

module.exports = {
  getCashStatementList,
  getCashStatementById,
  getSummaryList,
  getSearchList,
  createSearches,
  updateSearch,
  deleteSearch,
  syncCashStatements,
  syncCashStatementByNetsuiteId,
};
