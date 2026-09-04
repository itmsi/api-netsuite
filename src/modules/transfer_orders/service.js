const axios = require("axios");
const knex = require("knex");
const moment = require("moment");
const authService = require("../auth/service");
const { pgCore } = require("../../config/database");

// Knex instance untuk DB Netsuite (bridge_sanbox)
const dbNetsuite = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST_NETSUITE || "localhost",
    port: parseInt(process.env.DB_PORT_NETSUITE) || 9541,
    user: process.env.DB_USER_NETSUITE || "msiserver",
    password: process.env.DB_PASS_NETSUITE,
    database: process.env.DB_NAME_NETSUITE || "bridge_sanbox",
  },
});

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value),
  );

/**
 * Parse kolom jsonb yang bisa berbentuk string ataupun sudah object/array
 */
const parseJsonColumn = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }
  return value;
};

/**
 * Format tanggal ke D/M/YYYY menggunakan moment, mendukung beberapa format input.
 * Mengembalikan value asli jika tidak bisa di-parse.
 */
const formatDateDMY = (value) => {
  if (!value) return value;
  // parseZone: pertahankan tanggal sesuai offset aslinya (hindari pergeseran
  // tanggal akibat konversi ke local/UTC time, mis. "2026-09-02T00:00:00+07:00")
  const parsed = moment.parseZone(
    value,
    ["D/M/YYYY", "DD/MM/YYYY", "YYYY-MM-DD", moment.ISO_8601],
    true,
  );
  return parsed.isValid() ? parsed.format("D/M/YYYY") : value;
};

/**
 * Get transfer orders dari DB Netsuite (bridge_sanbox.transfer_orders)
 */
const getTransferOrders = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : "DESC";
    const offset = (page - 1) * limit;

    const validSortColumns = [
      "netsuite_id",
      "tranid",
      "tran_date",
      "status_code",
      "status_name",
      "from_location_id",
      "to_location_id",
      "last_modified_netsuite",
      "created_at",
      "updated_at",
    ];
    const orderCol = validSortColumns.includes(body.sort_by)
      ? body.sort_by
      : "created_at";

    let query = dbNetsuite("transfer_orders as t")
      .where("t.is_delete", false)
      .whereNotNull("t.netsuite_id")
      .where("t.netsuite_id", "!=", "");

    if (body.search) {
      query = query.where(function () {
        this.whereILike("t.tranid", `%${body.search}%`)
          .orWhereILike("t.netsuite_id", `%${body.search}%`)
          .orWhereILike("t.memo", `%${body.search}%`);
      });
    }
    if (body.from_location_id) {
      query = query.where("t.from_location_id", body.from_location_id);
    }
    if (body.to_location_id) {
      query = query.where("t.to_location_id", body.to_location_id);
    }
    if (body.status_name && body.status_name.length) {
      const statusNames = Array.isArray(body.status_name)
        ? body.status_name
        : [body.status_name];
      query = query.whereIn("t.status_name", statusNames);
    }
    if (body.status_code && body.status_code.length) {
      const statusCodes = Array.isArray(body.status_code)
        ? body.status_code
        : [body.status_code];
      query = query.whereIn("t.status_code", statusCodes);
    }
    // tran_date disimpan sebagai text format D/M/YYYY (mis. "9/7/2026")
    if (body.start_date) {
      query = query.whereRaw(
        "to_date(t.tran_date, 'FMDD/FMMM/YYYY') >= ?::date",
        [body.start_date],
      );
    }
    if (body.end_date) {
      query = query.whereRaw(
        "to_date(t.tran_date, 'FMDD/FMMM/YYYY') <= ?::date",
        [body.end_date],
      );
    }

    // Handle classes filter (parent and children)
    let classIds = [];
    if (body.classes) {
      const parentIdStr = body.classes.toString();
      classIds.push(parentIdStr);

      // Step 2 & 3: Cek ke tabel class untuk child yang memiliki parent_id tersebut
      const children = await dbNetsuite("class")
        .select("netsuite_id")
        .where("parent_id", parentIdStr)
        .andWhere("is_delete", false)
        .whereNull("deleted_at");

      // Step 4 & 5: Masukan daftar netsuite_id tersebut
      if (children && children.length > 0) {
        children.forEach((child) => {
          if (child.netsuite_id) classIds.push(child.netsuite_id.toString());
        });
      }
    }

    // Step 6: Apply class filter
    if (classIds.length > 0) {
      query = query.whereIn("t.class", classIds);
    }

    const countResult = await query.clone().count("* as total").first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const items = await query
      .clone()
      .leftJoin(
        "gate_sso_employees as created_emp",
        dbNetsuite.raw("t.created_by::text = created_emp.employee_id::text"),
      )
      .leftJoin(
        "gate_sso_employees as updated_emp",
        dbNetsuite.raw("t.updated_by::text = updated_emp.employee_id::text"),
      )
      .select([
        "t.id",
        "t.netsuite_id",
        "t.tranid",
        "t.status_code",
        "t.status_name",
        "t.from_location_id",
        "t.from_location_name",
        "t.to_location_id",
        "t.to_location_name",
        "t.memo",
        "t.tran_date",
        "t.datecreated",
        "t.last_modified_netsuite",
        "t.custbody_msi_createdby_api",
        // dbNetsuite.raw(
        //   "CASE WHEN NULLIF(t.custbody_msi_createdby_api, '') IS NULL THEN COALESCE(NULLIF(created_emp.employee_name, ''), '') ELSE t.custbody_msi_createdby_api END AS created_by_name",
        // ),
        // dbNetsuite.raw(
        //   "CASE WHEN NULLIF(created_emp.employee_name, '') IS NULL THEN COALESCE(NULLIF(t.custbody_msi_createdby_api, ''), '') ELSE created_emp.employee_name END AS created_by_name",
        // ),
        //intinya jika custbody_msi_createdby_api null maka dia di create dari netsuite langsung
        dbNetsuite.raw(
          "CASE WHEN NULLIF(t.custbody_msi_createdby_api, '') IS NULL THEN t.created_by_netsuite_name ELSE COALESCE(NULLIF(created_emp.employee_name, ''), '') END AS created_by_name",
        ),
        "updated_emp.employee_name as updated_by_name",
        "t.status_proccess",
        "t.status_proccess_message",
        "t.created_at",
        "t.updated_at",
      ])
      .orderBy(`t.${orderCol}`, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      items,
      pagination: { page, limit, total, totalPages },
    };
  } catch (error) {
    throw {
      message: error.message || "Failed to fetch transfer orders from database",
      statusCode: 500,
    };
  }
};

/**
 * Get transfer orders dari DB Netsuite (bridge_sanbox.transfer_orders)
 */
const getMobileTransferOrders = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : "DESC";
    const offset = (page - 1) * limit;

    const validSortColumns = [
      "netsuite_id",
      "tranid",
      "tran_date",
      "status_code",
      "status_name",
      "from_location_id",
      "to_location_id",
      "last_modified_netsuite",
      "created_at",
      "updated_at",
    ];
    const orderCol = validSortColumns.includes(body.sort_by)
      ? body.sort_by
      : "created_at";

    let query = dbNetsuite("transfer_orders as t")
      .where("t.is_delete", false)
      .whereNotNull("t.netsuite_id")
      .where("t.netsuite_id", "!=", "");

    if (body.search) {
      query = query.where(function () {
        this.whereILike("t.tranid", `%${body.search}%`)
          .orWhereILike("t.netsuite_id", `%${body.search}%`)
          .orWhereILike("t.memo", `%${body.search}%`);
      });
    }
    if (body.from_location_id) {
      query = query.where("t.from_location_id", body.from_location_id);
    }
    if (body.to_location_id) {
      query = query.where("t.to_location_id", body.to_location_id);
    }
    if (body.status_name && body.status_name.length) {
      const statusNames = Array.isArray(body.status_name)
        ? body.status_name
        : [body.status_name];
      query = query.whereIn("t.status_name", statusNames);
    }
    if (body.status_code && body.status_code.length) {
      const statusCodes = Array.isArray(body.status_code)
        ? body.status_code
        : [body.status_code];
      query = query.whereIn("t.status_code", statusCodes);
    }
    // tran_date disimpan sebagai text format D/M/YYYY (mis. "9/7/2026")
    if (body.start_date) {
      query = query.whereRaw(
        "to_date(t.tran_date, 'FMDD/FMMM/YYYY') >= ?::date",
        [body.start_date],
      );
    }
    if (body.end_date) {
      query = query.whereRaw(
        "to_date(t.tran_date, 'FMDD/FMMM/YYYY') <= ?::date",
        [body.end_date],
      );
    }

    // Handle classes filter (parent and children)
    let classIds = [];
    if (body.classes) {
      const parentIdStr = body.classes.toString();
      classIds.push(parentIdStr);

      // Step 2 & 3: Cek ke tabel class untuk child yang memiliki parent_id tersebut
      const children = await dbNetsuite("class")
        .select("netsuite_id")
        .where("parent_id", parentIdStr)
        .andWhere("is_delete", false)
        .whereNull("deleted_at");

      // Step 4 & 5: Masukan daftar netsuite_id tersebut
      if (children && children.length > 0) {
        children.forEach((child) => {
          if (child.netsuite_id) classIds.push(child.netsuite_id.toString());
        });
      }
    }

    // Step 6: Apply class filter
    if (classIds.length > 0) {
      query = query.whereIn("t.class", classIds);
    }

    const countResult = await query.clone().count("* as total").first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const items = await query
      .clone()
      .leftJoin(
        "gate_sso_employees as created_emp",
        dbNetsuite.raw("t.created_by::text = created_emp.employee_id::text"),
      )
      .leftJoin(
        "gate_sso_employees as updated_emp",
        dbNetsuite.raw("t.updated_by::text = updated_emp.employee_id::text"),
      )
      .select([
        "t.id",
        "t.netsuite_id",
        "t.tranid",
        "t.status_code",
        "t.status_name",
        "t.from_location_id",
        "t.from_location_name",
        "t.to_location_id",
        "t.to_location_name",
        "t.memo",
        "t.tran_date",
        "t.datecreated",
        "t.last_modified_netsuite",
        "t.custbody_msi_createdby_api",
        dbNetsuite.raw(
          "CASE WHEN NULLIF(t.custbody_msi_createdby_api, '') IS NULL THEN t.created_by_netsuite_name ELSE COALESCE(NULLIF(created_emp.employee_name, ''), '') END AS created_by_name",
        ),
        "updated_emp.employee_name as updated_by_name",
        "t.status_proccess",
        "t.status_proccess_message",
        "t.created_at",
        "t.updated_at",
        "t.items",
      ])
      .orderBy(`t.${orderCol}`, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      items,
      pagination: { page, limit, total, totalPages },
    };
  } catch (error) {
    throw {
      message: error.message || "Failed to fetch transfer orders from database",
      statusCode: 500,
    };
  }
};

/**
 * Get single transfer order by netsuite_id atau UUID id dari DB lokal
 */
const getTransferOrderById = async (id) => {
  try {
    const baseQuery = () =>
      dbNetsuite("transfer_orders as t")
        .where("t.is_delete", false)
        .leftJoin(
          "gate_sso_employees as created_emp",
          dbNetsuite.raw("t.created_by::text = created_emp.employee_id::text"),
        )
        .leftJoin(
          "gate_sso_employees as updated_emp",
          dbNetsuite.raw("t.updated_by::text = updated_emp.employee_id::text"),
        )
        .leftJoin(
          "locations as l",
          dbNetsuite.raw("l.netsuite_id::text = t.from_location_id::text"),
        )
        .leftJoin(
          "locations as l2",
          dbNetsuite.raw("l2.netsuite_id::text = t.to_location_id::text"),
        )
        .leftJoin(
          "customforms as c",
          dbNetsuite.raw("c.customform_id::text = t.customform::text"),
        )
        .leftJoin(
          "subsidiarys as s",
          dbNetsuite.raw("s.netsuite_id::text = t.subsidiary_id::text"),
        )
        .leftJoin(
          "departments as d",
          dbNetsuite.raw("d.netsuite_id::text = t.department_id::text"),
        )
        .leftJoin(
          "class as c2",
          dbNetsuite.raw("c2.netsuite_id::text = t.class_id::text"),
        )
        .leftJoin(
          "gate_sso_employees as gse",
          dbNetsuite.raw(
            "gse.employee_id_netsuite::text = t.employee_id::text",
          ),
        )
        .leftJoin(
          "customers as c3",
          dbNetsuite.raw("c3.netsuite_id::text = t.customer_id::text"),
        )
        .leftJoin(
          "vendors as v2",
          dbNetsuite.raw("v2.netsuite_id::text = t.logistic_vendor_id::text"),
        )
        // EXPLODE JSON & JOIN MASTER DARI JSON
        .leftJoin(
          dbNetsuite.raw(
            "LATERAL jsonb_array_elements(COALESCE(t.items, '[]'::jsonb)) WITH ORDINALITY AS arr(line, idx) ON TRUE",
          ),
        )
        .leftJoin(
          "items as i_line",
          dbNetsuite.raw("(line->>'item') = i_line.netsuite_id::text"),
        )
        .select([
          "t.id",
          "t.netsuite_id",
          "t.tranid",
          "t.status_code",
          "t.status_name",
          "t.from_location_id",
          dbNetsuite.raw(
            "COALESCE(NULLIF(t.from_location_name, ''), l.name) AS from_location_name",
          ),
          "t.to_location_id",
          dbNetsuite.raw(
            "COALESCE(NULLIF(t.to_location_name, ''), l2.name) AS to_location_name",
          ),
          "t.memo",
          "t.last_modified_netsuite",
          "t.created_at",
          "t.updated_at",
          "t.item_receipt_id",
          "t.created_from_to",
          "t.tran_date",
          "t.datecreated",
          "t.type_proccess",
          "t.status_proccess",
          "t.status_proccess_message",
          "t.url_proccess",
          "t.created_by",
          "t.updated_by",
          "t.custbody_msi_createdby_api",
          "t.is_delete",
          "t.deleted_by",
          "t.deleted_at",
          "t.customform",
          "t.subsidiary_id",
          "t.department_id",
          "t.class_id",
          "t.status",
          "t.incoterm_id",
          "t.employee_id",
          dbNetsuite.raw(
            "COALESCE(NULLIF(t.subsidiary_name, ''), s.subsidiary_name) AS subsidiary_name",
          ),
          dbNetsuite.raw(
            "COALESCE(NULLIF(t.department_name, ''), d.name) AS department_name",
          ),
          dbNetsuite.raw(
            "COALESCE(NULLIF(t.class_name, ''), c2.name) AS class_name",
          ),
          "t.incoterm_name",
          dbNetsuite.raw(
            "COALESCE(NULLIF(t.employee_name, ''), gse.employee_name) AS employee_name",
          ),
          "t.customer_id",
          dbNetsuite.raw(
            "COALESCE(NULLIF(t.customer_name, ''), c3.name) AS customer_name",
          ),
          "t.logistic_vendor_id",
          dbNetsuite.raw(
            "COALESCE(NULLIF(t.logistic_vendor_name, ''), v2.entity_id) AS logistic_vendor_name",
          ),
          "t.firmed",
          "t.use_item_cost_as_transfer_cost",
          "t.total",
          "t.customform_display",
          dbNetsuite.raw(
            "CASE WHEN NULLIF(t.custbody_msi_createdby_api, '') IS NULL THEN t.created_by_netsuite_name ELSE COALESCE(NULLIF(created_emp.employee_name, ''), '') END AS created_by_name",
          ),
          "updated_emp.employee_name as updated_by_name",
          "t.files",
          dbNetsuite.raw(`
          jsonb_agg(
            jsonb_build_object(
                'line_number', line->>'line_number',
                'item_id', COALESCE(NULLIF(line->>'item', ''), line->>'item_id'),
                'item_name', COALESCE(NULLIF(line->>'item_name', ''), i_line.item_id),
                'item_displayname', COALESCE(NULLIF(line->>'item_displayname', ''), i_line.display_name),
                'quantity', line->>'quantity',
                'description', line->>'description',
                'committed', line->>'committed',
                'shipped', line->>'shipped',
                'picked', line->>'picked',
                'packed', line->>'packed',
                'fulfilled', line->>'fulfilled',
                'received', line->>'received',
                'backorder', line->>'backorder',
                'transfer_price', COALESCE(NULLIF(line->>'transfer_price', ''), line->>'rate'),
                'amount', line->>'amount',
                'units', line->>'units',
                'from_location_id', line->>'from_location_id',
                'from_location_name', line->>'from_location_name',
                'order_priority', line->>'order_priority',
                'commitment_confirmed', line->>'commitment_confirmed',
                'closed', line->>'closed',
                'expected_receipt_date', COALESCE(NULLIF(line->>'expectedreceiptdate', ''), line->>'expected_receipt_date')
            ) ORDER BY idx ASC
          ) FILTER (WHERE line IS NOT NULL) AS items
        `),
        ])
        .groupBy([
          "t.id",
          "l.name",
          "l2.name",
          "c.customform_name",
          "s.subsidiary_name",
          "d.name",
          "c2.name",
          "gse.employee_name",
          "c3.name",
          "v2.entity_id",
          "created_emp.employee_name",
          "updated_emp.employee_name",
        ]);

    // Cari dulu berdasarkan netsuite_id, jika tidak ketemu cari berdasarkan id (UUID)
    let record = await baseQuery().where("t.netsuite_id", id).first();

    if (!record && isUuid(id)) {
      record = await baseQuery().where("t.id", id).first();
    }

    if (!record) {
      throw {
        message: `Transfer order dengan id '${id}' tidak ditemukan`,
        statusCode: 404,
      };
    }

    record.items = (record.items || []).map((item) => ({
      ...item,
      expected_receipt_date: formatDateDMY(item.expected_receipt_date),
    }));
    // record.data = parseJsonColumn(record.data, {});
    record.files = parseJsonColumn(record.files, []);

    return {
      success: true,
      data: record,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw {
      message: error.message || "Failed to fetch transfer order detail",
      statusCode: 500,
    };
  }
};

/**
 * Hit bridge API untuk sync list transfer orders (halaman pertama) sebelum diambil dari DB lokal.
 * Hit: POST {BRIDGE_BASE_URL}/api/v1/bridge/transfer-orders/get (is_sync: true)
 */
const syncTransferOrdersListFromBridge = async (body) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl =
      process.env.BRIDGE_BASE_URL || "https://api-bridge-sb.motorsights.com";
    const url = `${baseUrl}/api/v1/bridge/transfer-orders/get`;

    const requestData = {
      page: parseInt(body.page) || 1,
      page_size: parseInt(body.limit) || 10,
      sort_by: body.sort_by || "lastmodifieddate",
      sort_order: body.sort_order ? body.sort_order.toUpperCase() : "DESC",
      is_sync: true,
      filters: body.filters || {},
    };

    const response = await axios.post(url, requestData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      timeout: 1500000,
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw {
        message:
          error.response.data?.message ||
          "Failed to sync transfer orders list from bridge API",
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

/**
 * Hits the actual bridge API to sync a transfer order given its NetSuite internal ID
 * Hit: POST {BRIDGE_BASE_URL}/api/v1/bridge/transfer-orders/sync/{netsuite_id}
 */
const syncTransferOrderToBridge = async (netsuiteId) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl =
      process.env.BRIDGE_BASE_URL || "https://api-bridge-sb.motorsights.com";
    const url = `${baseUrl}/api/v1/bridge/transfer-orders/sync/${netsuiteId}`;

    const response = await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 1500000,
      },
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw {
        message:
          error.response.data?.message ||
          `Failed to sync transfer order netsuite_id ${netsuiteId} from bridge API`,
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

/**
 * Sync single transfer order by ID (bisa UUID lokal atau netsuite_id) dari bridge API.
 * `id` di-resolve dulu ke netsuite_id sebelum hit bridge.
 */
const syncTransferOrderById = async (id) => {
  const record = await dbNetsuite("transfer_orders as t")
    .where(function () {
      this.where("t.netsuite_id", id);
      if (isUuid(id)) this.orWhere("t.id", id);
    })
    .first();

  if (!record) {
    throw {
      message: `Transfer order dengan id '${id}' tidak ditemukan secara lokal`,
      statusCode: 404,
    };
  }

  if (!record.netsuite_id) {
    throw {
      message: `Transfer order dengan id '${id}' belum memiliki netsuite ID, tidak bisa di-sync`,
      statusCode: 400,
    };
  }

  return syncTransferOrderToBridge(record.netsuite_id);
};

/**
 * Initiate Transfer Order creation process (Async via Outbox Pattern)
 */
const createTransferOrder = async (body, user, userId) => {
  const trx = await dbNetsuite.transaction();
  try {
    // 1. create data ke DB netsuite tabel transfer_orders
    const toData = {
      tranid: null,
      status_name: "pending",
      from_location_id: body.location,
      to_location_id: body.transferlocation,
      memo: body.memo,
      tran_date: body.trandate,
      items: JSON.stringify(body.items || []),
      data: JSON.stringify({
        customform: body.customform,
        subsidiary: body.subsidiary,
        department: body.department,
        class: body.class,
        status: body.status,
        incoterm: body.incoterm,
        employee: body.employee,
        firmed: body.firmed,
        useitemcostastransfercost: body.useitemcostastransfercost,
        custbody_me_logistic_vendor: body.custbody_me_logistic_vendor,
        custbody_me_inv_customer: body.custbody_me_inv_customer,
      }),
      files: body.files ? JSON.stringify(body.files) : null,
      raw_request: JSON.stringify(body),
      custbody_msi_createdby_api:
        body.custbody_msi_createdby_api || user?.email,
      created_by: userId,
      created_at: new Date(),
      type_proccess: "CREATE",
      status_proccess: "PROCESSING",
      status_proccess_message: "Processing transfer order creation in NetSuite",
    };

    const [toInternal] = await trx("transfer_orders")
      .insert(toData)
      .returning("id");
    const toInternalId =
      typeof toInternal === "object" ? toInternal.id : toInternal;

    // 2. create satu data ke outbox_events dan satu log awal ke outbox_event_logs
    const eventData = {
      event_type: "CREATE",
      payload: JSON.stringify(body),
      aggregate_id: toInternalId,
      aggregate_type: "transfer_order_create",
      status: "WAITING",
      retry_count: 0,
      max_retry: 3,
      last_error: null,
      properties: JSON.stringify({
        request: body,
      }),
      created_at: toData.created_at,
      updated_at: toData.created_at,
    };

    const [eventIdObj] = await trx("outbox_events")
      .insert(eventData)
      .returning("id");
    const eventId = typeof eventIdObj === "object" ? eventIdObj.id : eventIdObj;

    // Satu log awal
    await trx("outbox_event_logs").insert({
      outbox_event_id: eventId,
      properties: JSON.stringify({
        response: {
          message: "Transfer order queued for processing",
          status: "WAITING",
        },
      }),
      created_at: toData.created_at,
      updated_at: toData.created_at,
    });

    await trx.commit();

    // 3. buatkan queue untuk rabbit mq untuk memproses data tersebut
    const { publishToRabbitMqQueueSingle } = require("../../config/rabbitmq");
    const { EXCHANGES, QUEUE } = require("../../utils/constant");

    await publishToRabbitMqQueueSingle(
      EXCHANGES.TRANSFER_ORDER_CREATE,
      QUEUE.TRANSFER_ORDER_CREATE,
      {
        event_id: eventId,
        to_internal_id: toInternalId,
        data: body,
      },
      {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": `${EXCHANGES.TRANSFER_ORDER_CREATE}-retry`,
        },
      },
    );

    return {
      success: true,
      message: "Transfer order is being processed",
      data: {
        toId: toInternalId,
        event_id: eventId,
      },
    };
  } catch (error) {
    if (trx) await trx.rollback();
    throw {
      message: error.message || "Failed to initiate transfer order creation",
      statusCode: 500,
    };
  }
};

/**
 * Normalize transfer-order file payload to the NetSuite bridge contract.
 * Accepts both legacy local fields and already-normalized bridge fields.
 */
const normalizeTransferOrderPayloadForBridge = (body = {}) => {
  const nextBody = { ...body };

  if (!Array.isArray(nextBody.files)) {
    return nextBody;
  }

  nextBody.files = nextBody.files.map((file) => {
    if (!file || typeof file !== "object") return file;

    const hasLegacyKeys =
      Object.prototype.hasOwnProperty.call(file, "fileUrl") ||
      Object.prototype.hasOwnProperty.call(file, "fileName") ||
      Object.prototype.hasOwnProperty.call(file, "netsuiteId");

    const hasBridgeKeys =
      Object.prototype.hasOwnProperty.call(file, "file_url") ||
      Object.prototype.hasOwnProperty.call(file, "file_name");

    if (!hasLegacyKeys && hasBridgeKeys) {
      return file;
    }

    return {
      file_name: file.file_name || file.fileName || null,
      file_url: file.file_url || file.fileUrl || null,
    };
  });

  return nextBody;
};

const normalizeNetsuiteIdValue = (value) => String(value ?? "").trim();

const getTransferOrderFinalizeTargets = (tempNetsuiteId, files = []) => {
  if (!Array.isArray(files) || files.length === 0) return [];

  const normalizedTempId = normalizeNetsuiteIdValue(tempNetsuiteId);

  return files
    .filter((file) => {
      const sourceNetsuiteId =
        file?.netsuiteId || file?.netsuite_id || file?.tempNetsuiteId;
      const sourceStoragePath = file?.storagePath || file?.storage_path;
      const normalizedSourceId = normalizeNetsuiteIdValue(sourceNetsuiteId);

      const matchesTempId =
        normalizedTempId &&
        normalizedSourceId &&
        normalizedSourceId === normalizedTempId;

      const matchesPayloadTempId =
        normalizedSourceId &&
        normalizedTempId &&
        normalizedSourceId === normalizedTempId;

      return (
        (matchesTempId ||
          matchesPayloadTempId ||
          (!normalizedSourceId &&
            sourceStoragePath &&
            sourceStoragePath.includes("/Temp/"))) &&
        sourceStoragePath
      );
    })
    .map((file) => ({
      storage_path: file.storagePath || file.storage_path,
      share_url: file.fileUrl || file.file_url || file.share_url || null,
      file_name: file.fileName || file.file_name || null,
      netsuite_id: file.netsuiteId || file.netsuite_id || tempNetsuiteId,
    }));
};

/**
 * Hits the actual bridge API for Transfer Order creation (used by worker)
 */
const createTransferOrderToBridge = async (body) => {
  const tokenResponse = await authService.getToken();
  const token = tokenResponse.data.access_token;

  const baseUrl =
    process.env.BRIDGE_BASE_URL || "https://api-bridge-sb.motorsights.com";
  const url = `${baseUrl}/api/v1/bridge/transfer-orders/create`;

  const normalizedBody = normalizeTransferOrderPayloadForBridge(body);

  const response = await axios.post(url, normalizedBody, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    timeout: 1500000,
  });

  return response.data;
};

/**
 * Initiate Transfer Order update process (Async via Outbox Pattern)
 */
const updateTransferOrder = async (body, user, userId) => {
  const trx = await dbNetsuite.transaction();
  try {
    const { id } = body;

    const record = await trx("transfer_orders")
      .where(function () {
        this.where("netsuite_id", id);
        if (isUuid(id)) this.orWhere("id", id);
      })
      .first();

    if (!record) {
      throw {
        message: `Transfer order dengan ID ${id} tidak ditemukan secara lokal`,
        statusCode: 404,
      };
    }

    const localId = record.id;
    const netsuiteId = record.netsuite_id;
    const is_update = record.netsuite_id ? true : false;

    // 1. Update data di DB lokal dulu
    const updateData = {
      from_location_id: body.location,
      to_location_id: body.transferlocation,
      memo: body.memo,
      tran_date: body.trandate,
      items: JSON.stringify(body.items || []),
      data: JSON.stringify({
        customform: body.customform,
        subsidiary: body.subsidiary,
        department: body.department,
        class: body.class,
        status: body.status,
        incoterm: body.incoterm,
        employee: body.employee,
        firmed: body.firmed,
        useitemcostastransfercost: body.useitemcostastransfercost,
        custbody_me_logistic_vendor: body.custbody_me_logistic_vendor,
        custbody_me_inv_customer: body.custbody_me_inv_customer,
      }),
      files: body.files ? JSON.stringify(body.files) : null,
      raw_request: JSON.stringify(body),
      custbody_msi_createdby_api:
        body.custbody_msi_createdby_api || user?.email,
      updated_at: new Date(),
      updated_by: userId,
      type_proccess: "UPDATE",
      status_proccess: "PROCESSING",
      status_proccess_message: "Processing transfer order update in NetSuite",
    };

    await trx("transfer_orders").where("id", localId).update(updateData);

    // 2. Insert data ke tabel outbox_events dan outbox_event_logs
    const eventData = {
      event_type: is_update ? "UPDATE" : "CREATE",
      payload: JSON.stringify(body),
      aggregate_id: localId,
      aggregate_type: is_update
        ? "transfer_order_update"
        : "transfer_order_create",
      status: "WAITING",
      retry_count: 0,
      max_retry: 3,
      last_error: null,
      properties: JSON.stringify({ request: body }),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [eventIdObj] = await trx("outbox_events")
      .insert(eventData)
      .returning("id");
    const eventId = typeof eventIdObj === "object" ? eventIdObj.id : eventIdObj;

    await trx("outbox_event_logs").insert({
      outbox_event_id: eventId,
      properties: JSON.stringify({
        response: {
          message: is_update
            ? "Update queued for processing"
            : "Create queued for processing",
          status: "WAITING",
        },
      }),
      created_at: new Date(),
      updated_at: new Date(),
    });

    await trx.commit();

    if (is_update) {
      // 3. Menambahkan queue untuk rabbitmq proses update
      const { publishToRabbitMqQueueSingle } = require("../../config/rabbitmq");
      const { EXCHANGES, QUEUE } = require("../../utils/constant");

      // Ganti body.id dengan netsuiteId sebelum dikirim ke queue update
      const bodyWithNetsuiteId = { ...body, id: netsuiteId };

      await publishToRabbitMqQueueSingle(
        EXCHANGES.TRANSFER_ORDER_UPDATE,
        QUEUE.TRANSFER_ORDER_UPDATE,
        {
          event_id: eventId,
          to_internal_id: localId,
          data: bodyWithNetsuiteId,
        },
        {
          durable: true,
          arguments: {
            "x-dead-letter-exchange": `${EXCHANGES.TRANSFER_ORDER_UPDATE}-retry`,
          },
        },
      );
    } else {
      // 3. Menambahkan queue untuk rabbitmq proses create
      const { publishToRabbitMqQueueSingle } = require("../../config/rabbitmq");
      const { EXCHANGES, QUEUE } = require("../../utils/constant");

      // Hilangkan payload id sebelum dikirim ke queue create (seperti unset di PHP)
      const { id: _removedId, ...bodyWithoutId } = body;

      await publishToRabbitMqQueueSingle(
        EXCHANGES.TRANSFER_ORDER_CREATE,
        QUEUE.TRANSFER_ORDER_CREATE,
        {
          event_id: eventId,
          to_internal_id: localId,
          data: bodyWithoutId,
        },
        {
          durable: true,
          arguments: {
            "x-dead-letter-exchange": `${EXCHANGES.TRANSFER_ORDER_CREATE}-retry`,
          },
        },
      );
    }

    return {
      success: true,
      message: "Transfer order update is being processed",
      data: {
        toId: localId,
        event_id: eventId,
      },
    };
  } catch (error) {
    if (trx) await trx.rollback();
    throw {
      message: error.message || "Failed to initiate transfer order update",
      statusCode: error.statusCode || 500,
      errors: error.errors || error,
    };
  }
};

/**
 * Hits the actual bridge API for Transfer Order update (used by worker)
 */
const updateTransferOrderToBridge = async (body) => {
  const tokenResponse = await authService.getToken();
  const token = tokenResponse.data.access_token;

  const baseUrl =
    process.env.BRIDGE_BASE_URL || "https://api-bridge-sb.motorsights.com";
  const url = `${baseUrl}/api/v1/bridge/transfer-orders/update`;

  const normalizedBody = normalizeTransferOrderPayloadForBridge(body);

  const response = await axios.post(url, normalizedBody, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    timeout: 1500000,
  });

  return response.data;
};

/**
 * Simpan netsuite_id ke record lokal setelah bridge berhasil membuat transfer order.
 * Menghapus duplikat pasif yang mungkin dibuat oleh bridge (mirip pattern PO/quotation).
 */
const updateLocalTOId = async (id, netsuiteId) => {
  await dbNetsuite("transfer_orders")
    .where("netsuite_id", netsuiteId)
    .whereNot("id", id)
    .del();

  await dbNetsuite("transfer_orders").where("id", id).update({
    netsuite_id: netsuiteId,
    updated_at: new Date(),
  });
};

const updateLocalTOStatus = async (id, status) => {
  const updateData = { updated_at: new Date() };

  if (status) {
    updateData.status_name = status;
  }

  await dbNetsuite("transfer_orders").where("id", id).update(updateData);
};

const updateEventStatus = async (id, status, result, properties) => {
  const updateData = {
    status: status,
    updated_at: new Date(),
  };

  const finalProperties = properties || result;
  if (finalProperties) {
    updateData.properties =
      typeof finalProperties === "string"
        ? JSON.stringify({ message: finalProperties })
        : JSON.stringify(finalProperties);
  }

  await dbNetsuite("outbox_events").where("id", id).update(updateData);

  if (result) {
    await dbNetsuite("outbox_event_logs").insert({
      outbox_event_id: id,
      properties: JSON.stringify({
        response_data: result,
      }),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
};

/**
 * Increment retry_count dan update last_error di outbox_events.
 * Return row terbaru setelah update.
 */
const incrementRetryCount = async (id, errorMessage) => {
  const [updated] = await dbNetsuite("outbox_events")
    .where("id", id)
    .update({
      retry_count: dbNetsuite.raw("retry_count + 1"),
      last_error: errorMessage || null,
      status: "PROCESSING",
      updated_at: new Date(),
    })
    .returning(["retry_count", "max_retry"]);
  return updated;
};

/**
 * Cek apakah event masih bisa di-retry otomatis.
 */
const canAutoRetry = async (id) => {
  const event = await dbNetsuite("outbox_events")
    .where("id", id)
    .select("retry_count", "max_retry")
    .first();
  if (!event) return false;
  return event.retry_count < event.max_retry;
};

/**
 * Ambil status terkini dari outbox_events.
 */
const getEventStatus = async (id) => {
  const event = await dbNetsuite("outbox_events")
    .where("id", id)
    .select("status")
    .first();
  return event ? event.status : null;
};

const logEvent = async (eventId, type, message, data) => {
  const isError =
    type === "failed" || type === "sync_failed" || type === "retry";

  const responseData = {};
  if (isError) {
    responseData.error = {
      message: message || (data && data.message) || String(data),
      code: data && data.code ? data.code : undefined,
    };
  } else {
    responseData.message = message;
    if (data) responseData.data = data;
  }

  await dbNetsuite("outbox_event_logs").insert({
    outbox_event_id: eventId,
    http_status: data && data.statusCode ? String(data.statusCode) : null,
    error: isError ? message || (data && data.message) || String(data) : null,
    properties: JSON.stringify({ response: responseData }),
    created_at: new Date(),
    updated_at: new Date(),
  });
};

/**
 * Ambil transfer order dari DB Netsuite berdasarkan netsuite_id (untuk penamaan folder Nextcloud)
 */
const getTransferOrderByNetsuiteId = async (netsuiteId) => {
  const record = await dbNetsuite("transfer_orders")
    .where("netsuite_id", netsuiteId.toString())
    .andWhere("is_delete", false)
    .first();
  return record;
};

const saveFileRecord = async (fileData) => {
  const [record] = await pgCore("transfer_orders_files")
    .insert(fileData)
    .returning("*");
  return record;
};

const updateFileRecord = async (oldPath, newPath, newUrl) => {
  const [record] = await pgCore("transfer_orders_files")
    .where("storage_path", oldPath)
    .update({
      storage_path: newPath,
      share_url: newUrl,
    })
    .returning("*");
  return record;
};

/**
 * Pindahkan file dari folder temporary (netsuite_id sementara) ke folder final (netsuite_id asli)
 */
const finalizeUploadedFilesForTO = async (
  tempNetsuiteId,
  realNetsuiteId,
  inlineFiles = [],
) => {
  try {
    const nextcloud = require("../../utils/nextcloud");

    const normalizedTempId = normalizeNetsuiteIdValue(tempNetsuiteId);
    const normalizedRealId = normalizeNetsuiteIdValue(realNetsuiteId);
    const payloadTempIds = Array.from(
      new Set(
        (inlineFiles || [])
          .map((file) =>
            normalizeNetsuiteIdValue(
              file?.netsuiteId ?? file?.netsuite_id ?? file?.tempNetsuiteId,
            ),
          )
          .filter(Boolean),
      ),
    );

    const dbFiles = await pgCore("transfer_orders_files")
      .where(function () {
        if (normalizedTempId) {
          this.orWhereRaw("CAST(netsuite_id AS text) = ?", [normalizedTempId]);
        }
        if (normalizedRealId) {
          this.orWhereRaw("CAST(netsuite_id AS text) = ?", [normalizedRealId]);
        }
        if (payloadTempIds.length > 0) {
          this.orWhere(function () {
            this.whereIn(
              pgCore.raw("CAST(netsuite_id AS text)"),
              payloadTempIds,
            );
          });
        }
        this.orWhere("storage_path", "ilike", "%/Temp/%");
      })
      .orderBy("created_at", "desc");

    const directFiles = getTransferOrderFinalizeTargets(
      tempNetsuiteId,
      inlineFiles,
    );
    const files = [...(dbFiles || []), ...directFiles];

    if (!files || files.length === 0) {
      console.info(
        `[finalizeUploadedFilesForTO] No files found for temporary TO netsuite_id: ${tempNetsuiteId}`,
      );
      return;
    }

    // Ambil tranid dari db netsuite di tabel transfer_orders untuk penamaan folder
    let folderName = realNetsuiteId;
    try {
      const toRecord = await getTransferOrderByNetsuiteId(realNetsuiteId);
      if (toRecord && toRecord.tranid) {
        folderName = toRecord.tranid;
        console.info(
          `[finalizeUploadedFilesForTO] Found tranid: ${folderName} for netsuite_id: ${realNetsuiteId}`,
        );
      } else {
        console.warn(
          `[finalizeUploadedFilesForTO] No transfer order record or tranid found for netsuite_id: ${realNetsuiteId}, falling back to netsuite_id for folder name`,
        );
      }
    } catch (dbErr) {
      console.error(
        `[finalizeUploadedFilesForTO] Error retrieving tranid from DB Netsuite:`,
        dbErr.message,
      );
    }

    const year = new Date().getFullYear();
    const finalDir = `/NetSuite/TransferOrders/${year}/${folderName}`;

    await nextcloud.ensureDirectoryExists(finalDir);

    for (const file of files) {
      const oldStoragePath = file.storage_path || file.storagePath;

      if (!oldStoragePath) {
        continue;
      }

      // Jika file tidak ada di /Temp/, asumsikan sudah di folder yang benar.
      if (!oldStoragePath.includes("/Temp/")) {
        if (file.id && tempNetsuiteId !== realNetsuiteId.toString()) {
          await pgCore("transfer_orders_files")
            .where("id", file.id)
            .update({ netsuite_id: realNetsuiteId.toString() });
        }
        continue;
      }

      const fileName = oldStoragePath.split("/").pop();
      const newStoragePath = `${finalDir}/${fileName}`;

      console.info(
        `[finalizeUploadedFilesForTO] Moving file from ${oldStoragePath} to ${newStoragePath}`,
      );

      try {
        await nextcloud.client.moveFile(oldStoragePath, newStoragePath);

        if (file.id) {
          await pgCore("transfer_orders_files").where("id", file.id).update({
            netsuite_id: realNetsuiteId.toString(),
            storage_path: newStoragePath,
          });
        } else {
          await pgCore("transfer_orders_files").insert({
            netsuite_id: realNetsuiteId.toString(),
            file_name: file.file_name || file.fileName || fileName,
            file_name_original: file.file_name || file.fileName || fileName,
            storage_provider: "nextcloud",
            storage_path: newStoragePath,
            share_url: file.share_url || file.file_url || file.fileUrl || null,
          });
        }

        console.info(
          `[finalizeUploadedFilesForTO] File record updated successfully for file with path ${oldStoragePath}`,
        );
      } catch (moveErr) {
        console.error(
          `[finalizeUploadedFilesForTO] Failed to move file ${oldStoragePath}:`,
          moveErr.message,
        );
      }
    }
  } catch (error) {
    console.error(
      `[finalizeUploadedFilesForTO] Error finalizing files for TO ${realNetsuiteId}:`,
      error.message,
    );
  }
};

const getFileRecordById = async (id) => {
  const record = await pgCore("transfer_orders_files").where("id", id).first();
  return record;
};

const deleteFileRecord = async (id) => {
  const count = await pgCore("transfer_orders_files").where("id", id).delete();
  return count;
};

const updateFileRecordFields = async (id, updateData) => {
  const [record] = await pgCore("transfer_orders_files")
    .where("id", id)
    .update(updateData)
    .returning("*");
  return record;
};

const getFileRecordByShareUrl = async (shareUrl) => {
  const record = await pgCore("transfer_orders_files")
    .where("share_url", shareUrl)
    .first();
  return record;
};

module.exports = {
  normalizeTransferOrderPayloadForBridge,
  getTransferOrderFinalizeTargets,
  getTransferOrders,
  getMobileTransferOrders,
  getTransferOrderById,
  syncTransferOrderById,
  syncTransferOrderToBridge,
  syncTransferOrdersListFromBridge,
  createTransferOrder,
  createTransferOrderToBridge,
  updateTransferOrder,
  updateTransferOrderToBridge,
  updateLocalTOId,
  updateLocalTOStatus,
  updateEventStatus,
  incrementRetryCount,
  canAutoRetry,
  getEventStatus,
  logEvent,
  getTransferOrderByNetsuiteId,
  saveFileRecord,
  updateFileRecord,
  finalizeUploadedFilesForTO,
  getFileRecordById,
  deleteFileRecord,
  updateFileRecordFields,
  getFileRecordByShareUrl,
};
