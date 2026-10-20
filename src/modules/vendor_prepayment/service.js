const axios = require("axios");
const authService = require("../auth/service");
const { dbNetsuite } = require("../../config/database");

const TABLE = "vendor_prepayments";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Kolom bertipe varchar di DB tapi berisi angka
const NUMERIC_COLUMNS = ["payment", "exchangerate", "applied_total"];

const LIST_COLUMNS = [
  "vendor_prepayments.id",
  "vendor_prepayments.netsuite_id",
  "vendor_prepayments.customform_id",
  "vendor_prepayments.customform_name",
  "vendor_prepayments.transactionnumber",
  "vendor_prepayments.tranid",
  "vendor_prepayments.tran_date",
  "vendor_prepayments.entity_id",
  "vendor_prepayments.entity_name",
  "vendor_prepayments.purchaseorder_id",
  "vendor_prepayments.purchaseorder_name",
  "vendor_prepayments.account_id",
  "vendor_prepayments.account_name",
  "vendor_prepayments.payment",
  "vendor_prepayments.currency_id",
  "vendor_prepayments.currency_name",
  "vendor_prepayments.exchangerate",
  "vendor_prepayments.postingperiod_id",
  "vendor_prepayments.postingperiod_name",
  "vendor_prepayments.prepaymentaccount_id",
  "vendor_prepayments.prepaymentaccount_name",
  "vendor_prepayments.tobeprinted",
  "vendor_prepayments.printvoucher",
  "vendor_prepayments.memo",
  "vendor_prepayments.approval_status",
  "vendor_prepayments.approval_status_name",
  "vendor_prepayments.wf_created_by_id",
  "vendor_prepayments.wf_created_by_name",
  "vendor_prepayments.create_by_netsuite_id",
  "vendor_prepayments.create_by_netsuite_name",
  "vendor_prepayments.delegate_approver_id",
  "vendor_prepayments.delegate_approver_name",
  "vendor_prepayments.in_delegation",
  "vendor_prepayments.next_approver_blank",
  "vendor_prepayments.next_approver_blank_name",
  "vendor_prepayments.subsidiary_id",
  "vendor_prepayments.subsidiary_name",
  "vendor_prepayments.department_id",
  "vendor_prepayments.department_name",
  "vendor_prepayments.class_id",
  "vendor_prepayments.class_name",
  "vendor_prepayments.location_id",
  "vendor_prepayments.location_name",
  "vendor_prepayments.cseg_cn_cfi_id",
  "vendor_prepayments.cseg_cn_cfi_name",
  "vendor_prepayments.applied_total",
  "vendor_prepayments.last_modified_netsuite",
  "vendor_prepayments.is_deleted",
  "vendor_prepayments.created_at",
  "vendor_prepayments.updated_at",
  "vendor_prepayments.created_by",
  "vendor_prepayments.updated_by",
  "creator.employee_name as created_by_name",
  "updater.employee_name as update_by_name",
];

// Detail menambahkan kolom berat (address, applied_to, data)
const DETAIL_COLUMNS = [
  ...LIST_COLUMNS,
  "vendor_prepayments.address",
  "vendor_prepayments.applied_to",
];

// created_by/updated_by bertipe varchar, employee_id bertipe uuid
const baseQuery = () =>
  dbNetsuite(TABLE)
    .leftJoin("gate_sso_employees as creator", function () {
      this.on(
        dbNetsuite.raw("creator.employee_id::text"),
        "=",
        "vendor_prepayments.created_by",
      );
    })
    .leftJoin("gate_sso_employees as updater", function () {
      this.on(
        dbNetsuite.raw("updater.employee_id::text"),
        "=",
        "vendor_prepayments.updated_by",
      );
    });

const formatRow = (row) => {
  NUMERIC_COLUMNS.forEach((col) => {
    if (row[col] !== null && row[col] !== undefined && row[col] !== "") {
      const parsed = parseFloat(row[col]);
      row[col] = isNaN(parsed) ? row[col] : parsed;
    }
  });
  return row;
};

const isFilled = (value) =>
  value !== undefined &&
  value !== null &&
  value !== "nan" &&
  value !== "null" &&
  String(value).trim() !== "";

const getVendorPrepaymentById = async (id) => {
  try {
    let row;

    // 1. Cek berdasarkan netsuite_id (numeric)
    if (/^\d+$/.test(String(id))) {
      row = await baseQuery()
        .select(DETAIL_COLUMNS)
        .where("vendor_prepayments.netsuite_id", String(id))
        .where("vendor_prepayments.is_deleted", false)
        .first();
    }

    // 2. Jika tidak ketemu, cek berdasarkan UUID (kolom id)
    if (!row && UUID_REGEX.test(id)) {
      row = await baseQuery()
        .select(DETAIL_COLUMNS)
        .where("vendor_prepayments.id", id)
        .where("vendor_prepayments.is_deleted", false)
        .first();
    }

    if (!row) {
      throw {
        message: "Data vendor prepayment tidak ditemukan",
        statusCode: 404,
      };
    }

    return formatRow(row);
  } catch (error) {
    if (error.statusCode) throw error;
    throw {
      message:
        error.message || "Failed to fetch vendor prepayment from database",
      statusCode: 500,
    };
  }
};

const getVendorPrepaymentList = async (body = {}) => {
  try {
    const page = body.page !== undefined ? parseInt(body.page) : 1;
    const limit = parseInt(body.page_size) || parseInt(body.limit) || 20;
    const sortOrder =
      String(body.sort_order || "DESC").toUpperCase() === "ASC"
        ? "ASC"
        : "DESC";
    const offset = (page - 1 < 0 ? 0 : page - 1) * limit;

    const validSortColumns = [
      "id",
      "netsuite_id",
      "tranid",
      "transactionnumber",
      "tran_date",
      "entity_name",
      "purchaseorder_name",
      "payment",
      "applied_total",
      "approval_status",
      "last_modified_netsuite",
      "created_at",
      "updated_at",
    ];
    const sortByRaw = body.sort_by || "tran_date";
    const orderCol = validSortColumns.includes(sortByRaw)
      ? `vendor_prepayments.${sortByRaw}`
      : "vendor_prepayments.tran_date";

    let query = baseQuery();

    if (body.search) {
      const search = `%${body.search}%`;
      query = query.where(function () {
        this.whereILike("vendor_prepayments.netsuite_id", search)
          .orWhereILike("vendor_prepayments.tranid", search)
          .orWhereILike("vendor_prepayments.transactionnumber", search)
          .orWhereILike("vendor_prepayments.entity_name", search)
          .orWhereILike("vendor_prepayments.purchaseorder_name", search)
          .orWhereILike("vendor_prepayments.memo", search);
      });
    }
    // Default hanya tampilkan data yang belum dihapus
    query = query.where(
      "vendor_prepayments.is_deleted",
      body.is_deleted !== undefined && body.is_deleted !== null
        ? body.is_deleted
        : false,
    );

    // Filter exact match: key body -> kolom tabel
    const exactFilters = {
      entity_id: "entity_id",
      purchaseorder_id: "purchaseorder_id",
      subsidiary_id: "subsidiary_id",
      subsidiary: "subsidiary_id",
      approval_status: "approval_status",
      department_id: "department_id",
      location_id: "location_id",
      currency_id: "currency_id",
      class_id: "class_id",
      classes: "class_id",
      next_approver_blank: "next_approver_blank",
    };
    Object.entries(exactFilters).forEach(([key, column]) => {
      if (isFilled(body[key])) {
        query = query.where(
          `vendor_prepayments.${column}`,
          String(body[key]).trim(),
        );
      }
    });

    // tran_date disimpan sebagai varchar (ISO string), cast ke timestamptz
    if (body.tran_date_from) {
      query = query.whereRaw(
        "NULLIF(vendor_prepayments.tran_date, '')::timestamptz >= ?::date",
        [body.tran_date_from],
      );
    }
    if (body.tran_date_to) {
      query = query.whereRaw(
        "NULLIF(vendor_prepayments.tran_date, '')::timestamptz < (?::date + INTERVAL '1 day')",
        [body.tran_date_to],
      );
    }

    const countResult = await query
      .clone()
      .countDistinct("vendor_prepayments.id as total")
      .first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const rows = await query
      .clone()
      .select(LIST_COLUMNS)
      .modify((qb) => {
        // Kolom angka bertipe varchar, cast agar urutan sesuai nilai
        if (NUMERIC_COLUMNS.includes(sortByRaw)) {
          qb.orderByRaw(
            `NULLIF(${orderCol}, '')::numeric ${sortOrder} NULLS LAST`,
          );
        } else {
          qb.orderBy(orderCol, sortOrder);
        }
      })
      .limit(limit)
      .offset(offset);

    return {
      items: rows.map(formatRow),
      pagination: {
        page: page < 1 ? 1 : page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    throw {
      message:
        error.message || "Failed to fetch vendor prepayments from database",
      statusCode: 500,
    };
  }
};

const syncVendorPrepaymentById = async (netsuite_id) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl = process.env.BRIDGE_BASE_URL || "http://localhost:9570";
    const url = `${baseUrl}/api/v1/bridge/vendor-prepayments/sync/${netsuite_id}`;

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data?.data || response.data;
  } catch (error) {
    if (error.response) {
      throw {
        message:
          error.response.data?.message ||
          `Failed to sync vendor prepayment netsuite_id ${netsuite_id} from bridge API`,
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getVendorPrepaymentById,
  getVendorPrepaymentList,
  syncVendorPrepaymentById,
};
