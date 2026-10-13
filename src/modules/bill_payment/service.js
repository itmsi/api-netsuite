const axios = require("axios");
const authService = require("../auth/service");

const { dbNetsuite } = require("../../config/database");

/**
 * Get single bill payment by ID (UUID) atau netsuite_id (integer) dari DB Netsuite
 */
const getBillPaymentById = async (id) => {
  try {
    const selectCols = [
      "id",
      "netsuite_id",
      "transactionnumber",
      "tranid",
      "memo",
      "entity_display",
      "account_display",
      "currency_display",
      "postingperiod_display",
      "custbody_me_wf_created_by_display",
      "approvalstatus_display",
      "subsidiary_display",
      "class_display",
      "department_display",
      "location_display",
      "custbody_cseg_cn_cfi_display",
      "entity",
      "account",
      "currency",
      "postingperiod",
      "custbody_me_wf_created_by",
      "approvalstatus",
      "subsidiary",
      "class",
      "department",
      "location",
      "custbody_cseg_cn_cfi",
      "balance",
      "total",
      "exchangerate",
      "trandate",
      "last_modified_netsuite",
      "next_approver",
      "delegate_approver",
      "in_delegation",
      "next_approver_blank",
      "applied_to",
      "credit_applied",
      "workflow_history",
      "user_notes",
      "created_at",
      "updated_at",
      "is_deleted",
    ];

    // Deteksi: jika angka murni → cari di netsuite_id, selainnya → cari di id (UUID)
    const isNetsuiteId = /^\d+$/.test(String(id));

    const row = await dbNetsuite("bills_payments")
      .select(selectCols)
      .where(
        isNetsuiteId ? "netsuite_id" : "id",
        isNetsuiteId ? parseInt(id) : id,
      )
      .first();

    if (!row) {
      throw { message: "Data bill payment tidak ditemukan", statusCode: 404 };
    }

    return {
      id: row.id || null,
      netsuite_id: row.netsuite_id || null,
      transactionnumber: row.transactionnumber || "",
      tranid: row.tranid || "",
      memo: row.memo || "",
      entity_display: row.entity_display || "",
      account_display: row.account_display || "",
      currency_display: row.currency_display || "",
      postingperiod_display: row.postingperiod_display || "",
      custbody_me_wf_created_by_display:
        row.custbody_me_wf_created_by_display || "",
      approvalstatus_display: row.approvalstatus_display || "",
      subsidiary_display: row.subsidiary_display || "",
      class_display: row.class_display || "",
      department_display: row.department_display || "",
      location_display: row.location_display || "",
      custbody_cseg_cn_cfi_display: row.custbody_cseg_cn_cfi_display || "",
      entity: row.entity || null,
      account: row.account || null,
      currency: row.currency || null,
      postingperiod: row.postingperiod || null,
      custbody_me_wf_created_by: row.custbody_me_wf_created_by || null,
      approvalstatus: row.approvalstatus || null,
      subsidiary: row.subsidiary || null,
      class: row.class || null,
      department: row.department || null,
      location: row.location || null,
      custbody_cseg_cn_cfi: row.custbody_cseg_cn_cfi || null,
      balance: row.balance || null,
      total: row.total || null,
      exchangerate:
        row.exchangerate !== null && row.exchangerate !== undefined
          ? parseFloat(row.exchangerate)
          : null,
      trandate: row.trandate || null,
      last_modified_netsuite: row.last_modified_netsuite || null,
      next_approver: row.next_approver || null,
      delegate_approver: row.delegate_approver || null,
      in_delegation: row.in_delegation || false,
      next_approver_blank: row.next_approver_blank || null,
      applied_to: row.applied_to || null,
      credit_applied: row.credit_applied || null,
      workflow_history: row.workflow_history || null,
      user_notes: row.user_notes || null,
      created_at: row.created_at || null,
      updated_at: row.updated_at || null,
      is_deleted: row.is_deleted || false,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw {
      message: error.message || "Failed to fetch bill payment from database",
      statusCode: 500,
    };
  }
};

/**
 * Get bill payments dari DB Netsuite (bridge_sanbox.bills_payments)
 */
const getBillPaymentList = async (body) => {
  try {
    const page = body.page !== undefined ? parseInt(body.page) : 1;
    const limit = parseInt(body.page_size) || parseInt(body.limit) || 20;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : "DESC";
    const offset = (page - 1 < 0 ? 0 : page - 1) * limit;

    const validSortColumns = [
      "id",
      "netsuite_id",
      "transactionnumber",
      "tranid",
      "memo",
      "entity",
      "entity_display",
      "account",
      "account_display",
      "currency",
      "currency_display",
      "postingperiod",
      "postingperiod_display",
      "approvalstatus",
      "approvalstatus_display",
      "subsidiary",
      "subsidiary_display",
      "class",
      "class_display",
      "department",
      "department_display",
      "location",
      "location_display",
      "balance",
      "total",
      "exchangerate",
      "trandate",
      "last_modified_netsuite",
      "created_at",
      "updated_at",
    ];
    const sortByRaw = body.sort_by || "trandate";
    const orderCol = validSortColumns.includes(sortByRaw)
      ? `bills_payments.${sortByRaw}`
      : "bills_payments.trandate";

    let query = dbNetsuite("bills_payments").leftJoin(
      "bill_payment_workflow_history",
      function () {
        this.on(
          dbNetsuite.raw("CAST(bills_payments.netsuite_id AS VARCHAR)"),
          "=",
          "bill_payment_workflow_history.payment_id",
        );
      },
    );

    // Filter opsional
    if (body.search) {
      query = query.where(function () {
        this.whereILike("bills_payments.tranid", `%${body.search}%`)
          .orWhereILike("bills_payments.transactionnumber", `%${body.search}%`)
          .orWhereILike("bills_payments.entity_display", `%${body.search}%`)
          .orWhereILike("bills_payments.account_display", `%${body.search}%`)
          .orWhereILike("bills_payments.memo", `%${body.search}%`);
      });
    }
    if (body.is_deleted !== undefined) {
      query = query.where("bills_payments.is_deleted", body.is_deleted);
    }
    if (body.entity) {
      query = query.where("bills_payments.entity", body.entity);
    }
    if (body.currency) {
      query = query.where("bills_payments.currency", body.currency);
    }
    if (body.subsidiary) {
      query = query.where("bills_payments.subsidiary", body.subsidiary);
    }
    if (body.approvalstatus) {
      query = query.where("bills_payments.approvalstatus", body.approvalstatus);
    }
    if (body.department) {
      query = query.where("bills_payments.department", body.department);
    }
    if (body.location) {
      query = query.where("bills_payments.location", body.location);
    }
    if (body.trandate_from) {
      query = query.where("bills_payments.trandate", ">=", body.trandate_from);
    }
    if (body.trandate_to) {
      query = query.where("bills_payments.trandate", "<=", body.trandate_to);
    }

    // Filter current_approver_id
    const currentApproverId = body.current_approver_id;
    const hasCurrentApprover =
      currentApproverId !== undefined &&
      currentApproverId !== null &&
      //  currentApproverId !== '' &&
      String(currentApproverId).toLowerCase() !== "nan";
    if (hasCurrentApprover) {
      query = query.where(
        "bill_payment_workflow_history.current_approver_id",
        currentApproverId,
      );
    }

    // Hitung total
    const countResult = await query
      .clone()
      .countDistinct("bills_payments.id as total")
      .first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    // Select semua kolom secara eksplisit (tidak menggunakan SELECT *)
    const rows = await query
      .clone()
      .select([
        "bills_payments.id",
        "bills_payments.netsuite_id",
        "bills_payments.transactionnumber",
        "bills_payments.tranid",
        "bills_payments.memo",
        "bills_payments.entity_display",
        "bills_payments.account_display",
        "bills_payments.currency_display",
        "bills_payments.postingperiod_display",
        "bills_payments.custbody_me_wf_created_by_display",
        "bills_payments.approvalstatus_display",
        "bills_payments.subsidiary_display",
        "bills_payments.class_display",
        "bills_payments.department_display",
        "bills_payments.location_display",
        "bills_payments.custbody_cseg_cn_cfi_display",
        "bills_payments.entity",
        "bills_payments.account",
        "bills_payments.currency",
        "bills_payments.postingperiod",
        "bills_payments.custbody_me_wf_created_by",
        "bills_payments.approvalstatus",
        "bills_payments.subsidiary",
        "bills_payments.class",
        "bills_payments.department",
        "bills_payments.location",
        "bills_payments.custbody_cseg_cn_cfi",
        "bills_payments.balance",
        "bills_payments.total",
        "bills_payments.exchangerate",
        "bills_payments.trandate",
        "bills_payments.last_modified_netsuite",
        "bills_payments.next_approver",
        "bills_payments.delegate_approver",
        "bills_payments.in_delegation",
        "bills_payments.next_approver_blank",
        "bills_payments.created_at",
        "bills_payments.updated_at",
        "bills_payments.is_deleted",
      ])
      .groupBy("bills_payments.netsuite_id", "bills_payments.id")
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    const items = rows.map((r) => ({
      id: r.id || null,
      netsuite_id: r.netsuite_id || null,
      transactionnumber: r.transactionnumber || "",
      tranid: r.tranid || "",
      memo: r.memo || "",
      entity_display: r.entity_display || "",
      account_display: r.account_display || "",
      currency_display: r.currency_display || "",
      postingperiod_display: r.postingperiod_display || "",
      custbody_me_wf_created_by_display:
        r.custbody_me_wf_created_by_display || "",
      approvalstatus_display: r.approvalstatus_display || "",
      subsidiary_display: r.subsidiary_display || "",
      class_display: r.class_display || "",
      department_display: r.department_display || "",
      location_display: r.location_display || "",
      custbody_cseg_cn_cfi_display: r.custbody_cseg_cn_cfi_display || "",
      entity: r.entity || null,
      account: r.account || null,
      currency: r.currency || null,
      postingperiod: r.postingperiod || null,
      custbody_me_wf_created_by: r.custbody_me_wf_created_by || null,
      approvalstatus: r.approvalstatus || null,
      subsidiary: r.subsidiary || null,
      class: r.class || null,
      department: r.department || null,
      location: r.location || null,
      custbody_cseg_cn_cfi: r.custbody_cseg_cn_cfi || null,
      balance: r.balance || null,
      total: r.total || null,
      exchangerate:
        r.exchangerate !== null && r.exchangerate !== undefined
          ? parseFloat(r.exchangerate)
          : null,
      trandate: r.trandate || null,
      last_modified_netsuite: r.last_modified_netsuite || null,
      created_at: r.created_at || null,
      updated_at: r.updated_at || null,
      is_deleted: r.is_deleted || false,
      next_approver: r.next_approver || null,
      delegate_approver: r.delegate_approver || null,
      in_delegation: r.in_delegation || false,
      next_approver_blank: r.next_approver_blank || null,
    }));

    const resPage =
      page === 1 && offset === 0 && body.page === 1 ? body.page : 0;

    return {
      items,
      pagination: {
        page: resPage || page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    throw {
      message: error.message || "Failed to fetch bill payments from database",
      statusCode: 500,
    };
  }
};

/**
 * Force sync satu bill payment by netsuite_id — hit bridge API GET /bills-payments/sync/:netsuite_id
 */
const syncBillPaymentById = async (netsuite_id) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl = process.env.BRIDGE_BASE_URL || "http://localhost:9570";
    const url = `${baseUrl}/api/v1/bridge/bills-payments/sync/${netsuite_id}`;

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
          `Failed to sync bill payment netsuite_id ${netsuite_id} from bridge API`,
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

/**
 * Get bill payment attachments dari DB Netsuite (bridge_sanbox.bills_payment_attachments)
 */
const getAttachmentFileList = async (body) => {
  try {
    const page = body.page !== undefined ? parseInt(body.page) : 1;
    const limit = parseInt(body.page_size) || parseInt(body.limit) || 20;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : "DESC";
    const offset = (page - 1 < 0 ? 0 : page - 1) * limit;

    const validSortColumns = [
      "bill_payment_netsuite_id",
      "tran_id",
      "status",
      "file_netsuite_id",
      "file_name",
      "file_type",
      "created_at",
      "updated_at",
    ];
    const orderCol = validSortColumns.includes(body.sort_by)
      ? body.sort_by
      : "created_at";

    let query = dbNetsuite("bills_payment_attachments").where(
      "is_deleted",
      body.is_deleted !== undefined ? body.is_deleted : false,
    );

    if (body.bill_payment_netsuite_id) {
      query = query.where(
        "bill_payment_netsuite_id",
        String(body.bill_payment_netsuite_id),
      );
    }
    if (body.file_netsuite_id) {
      query = query.where("file_netsuite_id", String(body.file_netsuite_id));
    }
    if (body.status) {
      query = query.where("status", String(body.status).toUpperCase());
    }
    if (body.search) {
      query = query.where(function () {
        this.whereILike("file_name", `%${body.search}%`).orWhereILike(
          "tran_id",
          `%${body.search}%`,
        );
      });
    }

    const countResult = await query.clone().count("id as total").first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const rows = await query
      .clone()
      .select([
        "id",
        "bill_payment_netsuite_id",
        "tran_id",
        "count",
        "skipped_count",
        "status",
        "file_netsuite_id",
        "file_name",
        "file_type",
        "file_size",
        "file_is_text",
        "file_skipped",
        "file_link",
        "created_at",
        "created_by",
        "updated_at",
        "updated_by",
        "is_deleted",
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    const baseUrl = (process.env.APP_BASE_URL || "").replace(/\/+$/, "");
    const items = rows.map((r) => ({
      ...r,
      // download_url:
      //   r.status === "SUCCESS" && r.file_link
      //     ? `${baseUrl}/api/netsuite/bill-payment/attachments-files/download/${r.file_netsuite_id}`
      //     : null,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    throw {
      message:
        error.message ||
        "Failed to fetch bill payment attachments from database",
      statusCode: 500,
    };
  }
};

/**
 * POST ke bridge API bills-payments dengan token auth
 */
const postToBridge = async (path, payload, defaultErrorMessage) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl = process.env.BRIDGE_BASE_URL || "http://localhost:9570";
    const url = `${baseUrl}/api/v1/bridge/bills-payments${path}`;

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data?.data || response.data;
  } catch (error) {
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

/**
 * Sync daftar attachment satu bill payment — hit bridge API POST /bills-payments/attachments-files/get
 */
const syncAttachmentFiles = async (id) =>
  postToBridge(
    "/attachments-files/get",
    { id: parseInt(id) },
    `Failed to sync attachments bill payment netsuite_id ${id} from bridge API`,
  );

/**
 * Convert satu file attachment — hit bridge API POST /bills-payments/attachments-files/converted
 */
const syncAttachmentFileById = async (billPaymentNetsuiteId, fileNetsuiteId) =>
  postToBridge(
    "/attachments-files/converted",
    {
      bill_payment_netsuite_id: String(billPaymentNetsuiteId),
      file_netsuite_id: String(fileNetsuiteId),
    },
    `Failed to convert attachment file ${fileNetsuiteId} from bridge API`,
  );

/**
 * Get link download file attachment by file_netsuite_id — hit bridge API
 * POST /bills-payments/attachments-files/download
 */
const downloadAttachmentFile = async (fileNetsuiteId) =>
  postToBridge(
    "/attachments-files/download",
    { file_netsuite_id: String(fileNetsuiteId) },
    `Failed to get download link file ${fileNetsuiteId} from bridge API`,
  );

module.exports = {
  getBillPaymentById,
  getBillPaymentList,
  syncBillPaymentById,
  getAttachmentFileList,
  syncAttachmentFiles,
  syncAttachmentFileById,
  downloadAttachmentFile,
};
