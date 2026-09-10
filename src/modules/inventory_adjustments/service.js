const axios = require("axios");
const knex = require("knex");
const authService = require("../auth/service");

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

const INVENTORY_ADJUSTMENT_COLUMNS = [
  "t.id",
  "t.netsuite_id",
  "t.subsidiary",
  "t.subsidiary_display",
  "t.account",
  "t.account_display",
  "t.adj_location",
  "t.adj_location_display",
  "t.department",
  "t.department_display",
  "t.trandate",
  "t.class_id",
  "t.class_display",
  "t.memo",
  "t.customer_id",
  "t.customer_display",
  "t.me_po_number",
  "t.customform",
  "t.postingperiod",
  "t.postingperiod_display",
  "t.custbody_me_description",
  "t.custbody_me_inv_customer",
  "t.custbody_me_purchase_order_number",
  "t.custbody_msi_cycle_count_cumber",
  "t.custbody_me_opening_balance",
  "t.custbody_me_wf_created_by",
  "t.custbody_me_wf_created_by_display",
  "t.custbody_me_approval_status",
  "t.custbody_me_approval_status_display",
  "t.custbody_me_wf_next_approver_blank",
  "t.custbody_me_delegate_approver",
  "t.custbody_me_delegate_approver_display",
  "t.custbody_me_wf_in_delegation",
  "t.nextapprover",
  "t.last_modified",
  "t.datecreated",
  "t.tranid",
  "t.created_at",
  "t.created_by",
  "t.updated_at",
  "t.updated_by",
];

const INVENTORY_ADJUSTMENT_COLUMNS_DETAIL = [
  "t.id",
  "t.netsuite_id",
  "t.subsidiary",
  "t.subsidiary_display",
  "t.account",
  "t.account_display",
  "t.adj_location",
  "t.adj_location_display",
  "t.department",
  "t.department_display",
  "t.trandate",
  "t.class_id",
  "t.class_display",
  "t.memo",
  "t.customer_id",
  "t.customer_display",
  "t.me_po_number",
  "t.customform",
  "t.lines",
  "t.postingperiod",
  "t.postingperiod_display",
  "t.custbody_me_description",
  "t.custbody_me_inv_customer",
  "t.custbody_me_purchase_order_number",
  "t.custbody_msi_cycle_count_cumber",
  "t.custbody_me_opening_balance",
  "t.custbody_me_wf_created_by",
  "t.custbody_me_wf_created_by_display",
  "t.custbody_me_approval_status",
  "t.custbody_me_approval_status_display",
  "t.custbody_me_wf_next_approver_blank",
  "t.custbody_me_delegate_approver",
  "t.custbody_me_delegate_approver_display",
  "t.custbody_me_wf_in_delegation",
  "t.nextapprover",
  "t.last_modified",
  "t.datecreated",
  "t.user_notes",
  "t.files",
  "t.tranid",
  "t.created_at",
  "t.created_by",
  "t.updated_at",
  "t.updated_by",
];

const CREATED_UPDATED_BY_NAME_SELECTS = () => [
  // dbNetsuite.raw(
  //   "CASE WHEN NULLIF(t.custbody_msi_createdby_api, '') IS NULL THEN t.custbody_me_wf_created_by_display ELSE COALESCE(NULLIF(created_emp.employee_name, ''), '') END AS created_by_name",
  // ),
  dbNetsuite.raw(
    "CASE WHEN NULLIF(t.created_by, '') IS NULL THEN t.custbody_me_wf_created_by_display ELSE COALESCE(NULLIF(created_emp.employee_name, ''), '') END AS created_by_name",
  ),
  "updated_emp.employee_name as updated_by_name",
];

const withCreatedUpdatedByJoins = (query) =>
  query
    .leftJoin(
      "gate_sso_employees as created_emp",
      dbNetsuite.raw("t.created_by::text = created_emp.employee_id::text"),
    )
    .leftJoin(
      "gate_sso_employees as updated_emp",
      dbNetsuite.raw("t.updated_by::text = updated_emp.employee_id::text"),
    );

/**
 * Get inventory adjustments list dari DB Netsuite (bridge_sanbox.inventory_adjustments)
 */
const getInventoryAdjustmentsList = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit || body.page_size) || 20;
    const offset = (page - 1) * limit;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : "DESC";

    const validSortColumns = [
      "last_modified",
      "tranid",
      "trandate",
      "created_at",
      "updated_at",
    ];
    const orderCol = validSortColumns.includes(body.sort_by)
      ? body.sort_by
      : "last_modified";

    let query = dbNetsuite("inventory_adjustments as t")
      .where("t.is_delete", false)
      .whereNotNull("t.netsuite_id")
      .where("t.netsuite_id", "!=", "");

    if (body.search) {
      query = query.where(function () {
        this.whereILike("t.tranid", `%${body.search}%`)
          .orWhereILike("t.memo", `%${body.search}%`)
          .orWhereILike("t.customer_display", `%${body.search}%`)
          .orWhereILike("t.subsidiary_display", `%${body.search}%`)
          .orWhereILike("t.adj_location_display", `%${body.search}%`);
      });
    }

    if (body.subsidiary) {
      query = query.where("t.subsidiary", body.subsidiary);
    }

    if (body.adj_location) {
      query = query.where("t.adj_location", body.adj_location);
    }

    if (body.department) {
      query = query.where("t.department", body.department);
    }

    if (body.customer_id) {
      query = query.where("t.customer_id", body.customer_id);
    }

    // Handle class filter (parent and children)
    let classIds = [];
    if (body.classes) {
      const parentIdStr = body.classes.toString();
      classIds.push(parentIdStr);

      const children = await dbNetsuite("class")
        .select("netsuite_id")
        .where("parent_id", parentIdStr)
        .andWhere("is_delete", false)
        .whereNull("deleted_at");

      if (children && children.length > 0) {
        children.forEach((child) => {
          if (child.netsuite_id) classIds.push(child.netsuite_id.toString());
        });
      }
    }

    if (classIds.length > 0) {
      query = query.whereIn("t.class_id", classIds);
    }

    const countResult = await query.clone().count("t.id as total").first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const rows = await withCreatedUpdatedByJoins(query.clone())
      .select([
        ...INVENTORY_ADJUSTMENT_COLUMNS,
        ...CREATED_UPDATED_BY_NAME_SELECTS(),
      ])
      .orderBy(`t.${orderCol}`, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      items: rows,
      pagination: { page, limit, total, totalPages },
    };
  } catch (error) {
    throw {
      message:
        error.message || "Failed to fetch inventory adjustments from database",
      statusCode: 500,
    };
  }
};

/**
 * Get inventory adjustment detail by id (UUID) atau netsuite_id (string)
 */
const getInventoryAdjustmentById = async (id) => {
  try {
    const query = () =>
      withCreatedUpdatedByJoins(dbNetsuite("inventory_adjustments as t"))
        .where("t.is_delete", false)
        .select([
          ...INVENTORY_ADJUSTMENT_COLUMNS_DETAIL,
          ...CREATED_UPDATED_BY_NAME_SELECTS(),
        ]);

    let item;
    if (/^\d+$/.test(id)) {
      item = await query().where("t.netsuite_id", id).first();
    }

    if (!item) {
      item = await query().where("t.id", id).first();
    }

    if (!item) {
      throw {
        message: "Data inventory adjustment tidak ditemukan",
        statusCode: 404,
      };
    }

    return item;
  } catch (error) {
    if (error.statusCode) throw error;
    throw {
      message:
        error.message ||
        "Failed to fetch inventory adjustment detail from database",
      statusCode: 500,
    };
  }
};

/**
 * Sync single inventory adjustment by ID dari bridge API
 * Hit: POST {BRIDGE_BASE_URL}/api/v1/bridge/inventory/adjustments/sync/{id}
 */
const syncInventoryAdjustmentById = async (id) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl =
      process.env.BRIDGE_BASE_URL || "https://api-bridge-sb.motorsights.com";
    const url = `${baseUrl}/api/v1/bridge/inventory/adjustments/sync/${id}`;

    const response = await axios.post(
      url,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw {
        message:
          error.response.data?.message ||
          "Failed to sync inventory adjustment by ID from bridge API",
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

/**
 * Create inventory adjustment via bridge API
 * Hit: POST {BRIDGE_BASE_URL}/api/v1/bridge/inventory/adjustments
 */
const createInventoryAdjustment = async (body, user) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl =
      process.env.BRIDGE_BASE_URL || "https://api-bridge-sb.motorsights.com";
    const url = `${baseUrl}/api/v1/bridge/inventory/adjustments`;

    const payload = {
      ...body,
      created_by: body.created_by || user?.employee_id || user?.user_id || null,
    };

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw {
        message:
          error.response.data?.message ||
          "Failed to create inventory adjustment via bridge API",
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getInventoryAdjustmentsList,
  getInventoryAdjustmentById,
  syncInventoryAdjustmentById,
  createInventoryAdjustment,
};
