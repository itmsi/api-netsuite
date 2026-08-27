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

/**
 * Get items dari DB Netsuite (bridge_sanbox.items)
 * Format response identik dengan format bridge API sebelumnya.
 */
const getItemsList = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : "DESC";
    const offset = (page - 1) * limit;

    // Kolom yang boleh dijadikan sort_by
    const validSortColumns = [
      "netsuite_id",
      "item_id",
      "display_name",
      "last_modified_netsuite",
      "created_at",
      "updated_at",
    ];
    const sortByRaw =
      body.sort_by === "created_at"
        ? "last_modified_netsuite"
        : body.sort_by || "last_modified_netsuite";
    const orderCol = validSortColumns.includes(sortByRaw)
      ? sortByRaw
      : "last_modified_netsuite";

    let query = dbNetsuite("items").where("is_deleted", false);

    if (body.item_type) {
      const itemTypes = Array.isArray(body.item_type)
        ? body.item_type
        : [body.item_type];
      query = query.whereIn("type", itemTypes);
    }

    if (body.item_type_id) {
      const itemTypeIds = Array.isArray(body.item_type_id)
        ? body.item_type_id
        : [body.item_type_id];
      query = query.whereIn("type_id", itemTypeIds);
    }

    // Filter opsional
    if (body.search) {
      query = query.where(function () {
        this.whereILike("item_id", `%${body.search}%`)
          .orWhereILike("display_name", `%${body.search}%`)
          .orWhere("netsuite_id", body.search);
      });
    }

    // Hitung total
    const countResult = await query.clone().count("* as total").first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    // Select dengan alias sesuai format response
    const rows = await query
      .clone()
      .select([
        "netsuite_id as internalId",
        "item_id as itemId",
        "type as itemType",
        "display_name as displayName",
        "last_modified_netsuite as lastModifiedDate",
        "price_levels as priceLevels",
        "data",
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    // Map: ambil locations dari kolom data (JSONB), hapus data dari output
    const items = rows.map((row) => ({
      internalId: row.internalId,
      itemId: row.itemId,
      itemType: row.itemType,
      displayName: row.displayName || "",
      lastModifiedDate: row.lastModifiedDate,
      priceLevels: row.priceLevels,
      locations: row.data && row.data.locations ? row.data.locations : [],
    }));

    return {
      items,
      pagination: { page, limit, total, totalPages },
    };
  } catch (error) {
    throw {
      message: error.message || "Failed to fetch items from database",
      statusCode: 500,
    };
  }
};

/**
 * Sync items — hit bridge API (proses lama), return data langsung.
 */
const syncItemsList = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch data from bridge API
    const baseUrl =
      process.env.BRIDGE_BASE_URL || "https://api-bridge-sb.motorsights.com";
    const url = `${baseUrl}/api/v1/bridge/items/get`;

    const requestData = {
      pageIndex: body.page - 1 || 0,
      pageSize: body.limit || 10,
      sort_by:
        body.sort_by === "created_at"
          ? "last_modified"
          : body.sort_by || "last_modified",
      sort_order: body.sort_order ? body.sort_order.toUpperCase() : "DESC",
      search: body.search || null,
    };

    const response = await axios.post(url, requestData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const resData = response.data;

    return {
      items: resData.data || resData.items || [],
      pagination: {
        page: resData.page || resData.pageIndex || body.page || 1,
        limit: resData.page_size || resData.pageSize || body.limit || 10,
        total: resData.total_records || resData.totalRows || 0,
        totalPages: resData.total_pages || resData.totalPages || 0,
      },
    };
  } catch (error) {
    if (error.response) {
      throw {
        message:
          error.response.data.message || "Failed to sync items from bridge API",
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

/**
 * Sync single item by ID dari bridge API
 * Hit: POST {BRIDGE_BASE_URL}/api/v1/bridge/items/sync/netsuite/{id}
 */
const syncItemById = async (id) => {
  try {
    // 1. Get token
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Hit bridge sync by ID endpoint
    const baseUrl =
      process.env.BRIDGE_BASE_URL || "https://api-bridge-sb.motorsights.com";
    const url = `${baseUrl}/api/v1/bridge/items/sync/netsuite/${id}`;

    const response = await axios.post(
      url,
      {},
      {
        headers: {
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
          "Failed to sync item by ID from bridge API",
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

/**
 * Get single item by netsuite_id dari DB Netsuite (bridge_sanbox.items)
 */
const getItemByNetsuiteId = async (netsuiteId) => {
  try {
    const row = await dbNetsuite("items")
      .where("netsuite_id", netsuiteId.toString())
      .select([
        "netsuite_id as internalId",
        "item_id as itemId",
        "type as itemType",
        "display_name as displayName",
        "last_modified_netsuite as lastModifiedDate",
        "data",
      ])
      .first();

    if (!row) {
      throw { message: "Data item tidak ditemukan", statusCode: 404 };
    }

    return {
      internalId: row.internalId,
      itemId: row.itemId,
      itemType: row.itemType,
      displayName: row.displayName || "",
      lastModifiedDate: row.lastModifiedDate,
      locations: row.data && row.data.locations ? row.data.locations : [],
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw {
      message: error.message || "Failed to fetch item from database",
      statusCode: 500,
    };
  }
};

const { pgCore: db } = require("../../config/database");

/**
 * Memproses sync ke tabel items di gate_sso
 */
const processItemsSync = async (records) => {
  if (!records || records.length === 0) return;

  const trx = await db.transaction();
  try {
    for (const record of records) {
      const data = {
        netsuite_id: record.netsuite_id || record.id,
        item_id: record.item_id || null,
        display_name: record.display_name || null,
        type: record.type || null,
        data: record.data ? JSON.stringify(record.data) : null,
        last_modified_netsuite: record.last_modified_netsuite
          ? new Date(record.last_modified_netsuite)
          : null,
        is_deleted: record.is_deleted || null,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      };

      const existing = await trx("items")
        .where("netsuite_id", data.netsuite_id.toString())
        .first();
      if (existing) {
        await trx("items")
          .where("netsuite_id", data.netsuite_id.toString())
          .update(data);
      } else {
        data.created_at = db.fn.now();
        await trx("items").insert(data);
      }
    }
    await trx.commit();
  } catch (error) {
    await trx.rollback();
    console.error("Error syncing items to gate_sso:", error);
    throw error;
  }
};

/**
 * Get item locations with qtyAvailable > 0
 */
const getItemLocation = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const offset = (page - 1) * limit;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : "DESC";

    // Map sort_by parameter to actual columns
    let sortByRaw = body.sort_by || "created_at";
    let orderCol = "il.created_at";

    if (sortByRaw === "created_at" || sortByRaw === "last_modified_netsuite") {
      orderCol = "il.created_at";
    } else if (sortByRaw === "item_id" || sortByRaw === "item_code") {
      orderCol = "i.item_id";
    } else if (sortByRaw === "display_name" || sortByRaw === "item_name") {
      orderCol = "i.display_name";
    } else if (sortByRaw === "location_name") {
      orderCol = "l.name";
    } else if (sortByRaw === "qtyAvailable") {
      orderCol = 'il."qtyAvailable"';
    }

    let query = dbNetsuite("item_locations as il")
      .leftJoin(
        "locations as l",
        dbNetsuite.raw("l.netsuite_id::integer"),
        dbNetsuite.raw('il."inventorylocationId"::integer'),
      )
      .leftJoin(
        "items as i",
        dbNetsuite.raw("i.netsuite_id::integer"),
        dbNetsuite.raw("il.item_id::integer"),
      )
      .where(dbNetsuite.raw('il."qtyAvailable"::numeric'), ">", 0);

    // Filter opsional
    if (body.search) {
      query = query.where(function () {
        this.whereILike("i.item_id", `%${body.search}%`)
          .orWhereILike("i.display_name", `%${body.search}%`)
          .orWhereILike("l.name", `%${body.search}%`);
      });
    }

    // Hitung total
    const countResult = await query.clone().count("* as total").first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    // Select the specified columns
    const rows = await query
      .clone()
      .select([
        "il.inventorylocationId",
        "il.item_id",
        "l.name as location_name",
        "i.item_id as item_code",
        "i.display_name as item_name",
        "il.qtyAvailable",
        "il.qtyBackOrder",
        "il.qtyCommitted",
        "il.qtyOnHand",
        "il.qtyOnOrder",
      ])
      .orderByRaw(`${orderCol} ${sortOrder} NULLS LAST`)
      .limit(limit)
      .offset(offset);

    return {
      items: rows,
      pagination: { page, limit, total, totalPages },
    };
  } catch (error) {
    throw {
      message: error.message || "Failed to fetch item locations from database",
      statusCode: 500,
    };
  }
};

/**
 * Get receipts from local receives table
 */
const getItemReceipts = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit || body.page_size) || 20;
    const offset = (page - 1) * limit;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : "DESC";

    const validSortColumns = [
      "last_modified_netsuite",
      "tranid",
      "trandate",
      "created_at",
      "updated_at",
    ];
    const orderCol = validSortColumns.includes(body.sort_by)
      ? body.sort_by
      : "last_modified_netsuite";

    let query = dbNetsuite("receives")
      .whereNotNull("netsuite_id")
      .where("netsuite_id", "!=", "");

    if (body.search) {
      query = query.where(function () {
        this.whereILike("tranid", `%${body.search}%`)
          .orWhereILike("vendor_name", `%${body.search}%`)
          .orWhereILike("createdfrom", `%${body.search}%`)
          .orWhereILike("subsidiary_display", `%${body.search}%`)
          .orWhereILike("location_display", `%${body.search}%`);
      });
    }

    if (body.status) {
      query = query.where("status", body.status);
    }

    if (body.vendor_id) {
      query = query.where("vendor_id", body.vendor_id);
    }

    if (body.location) {
      query = query.where("location", body.location);
    }

    if (body.source_type) {
      query = query.where("source_type", body.source_type);
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
      query = query.whereIn("class", classIds);
    }

    const countResult = await query.clone().count("* as total").first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const rows = await query
      .clone()
      .select([
        "id",
        "netsuite_id",
        "source_type",
        "source_type_display",
        "tranid",
        "trandate",
        "status",
        "status_display",
        "memo",
        "vendor_id",
        "vendor_name",
        "createdfrom",
        "createdfrom_display",
        "subsidiary",
        "subsidiary_display",
        "location",
        "location_display",
        "department",
        "department_display",
        "class",
        "class_display",
        "last_modified_netsuite",
        "datecreated_netsuite",
        "created_at",
        "created_by_name",
        "updated_at",
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      items: rows,
      pagination: { page, limit, total, totalPages },
    };
  } catch (error) {
    throw {
      message: error.message || "Failed to fetch receipts from database",
      statusCode: 500,
    };
  }
};

/**
 * Get single receipt detail by id (UUID) or netsuite_id from local receives table
 */
const getItemReceiptById = async (id) => {
  try {
    const query = () =>
      dbNetsuite("receives").select([
        "id",
        "netsuite_id",
        "source_type",
        "source_type_display",
        "tranid",
        "trandate",
        "status",
        "status_display",
        "memo",
        "vendor_id",
        "vendor_name",
        "createdfrom",
        "createdfrom_display",
        "subsidiary",
        "subsidiary_display",
        "location",
        "location_display",
        "department",
        "department_display",
        "class",
        "class_display",
        "last_modified_netsuite",
        "datecreated_netsuite",
        "created_at",
        "created_by_name",
        "updated_at",
        "lines",
      ]);

    let item;
    if (/^\d+$/.test(id)) {
      item = await query().where("netsuite_id", id).first();
    }

    if (!item) {
      item = await query().where("id", id).first();
    }

    if (!item) {
      throw { message: "Data receipt tidak ditemukan", statusCode: 404 };
    }

    return item;
  } catch (error) {
    if (error.statusCode) throw error;
    throw {
      message: error.message || "Failed to fetch receipt detail from database",
      statusCode: 500,
    };
  }
};

/**
 * Create item receipt — hit bridge API
 * Hit: POST {BRIDGE_BASE_URL}/api/v1/bridge/items/item-receipt
 */
const createItemReceipt = async (body) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl =
      process.env.BRIDGE_BASE_URL || "https://api-bridge-sb.motorsights.com";
    const url = `${baseUrl}/api/v1/bridge/items/item-receipt`;

    const requestData = {
      transaction_type: body.transaction_type,
      transaction_id: body.transaction_id,
      items: body.items,
      note: body.note,
      noteTitle: body.noteTitle,
    };

    const response = await axios.post(url, requestData, {
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
          error.response.data?.message || "Failed to create item receipt",
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

/**
 * Create item fulfillment — hit bridge API
 * Hit: POST {BRIDGE_BASE_URL}/api/v1/bridge/items/item-fulfillment
 */
const createItemFulfillment = async (body) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl =
      process.env.BRIDGE_BASE_URL || "https://api-bridge-sb.motorsights.com";
    const url = `${baseUrl}/api/v1/bridge/items/item-fulfillment`;

    const requestData = {
      transaction_type: body.transaction_type,
      transaction_id: body.transaction_id,
      ship_status: body.ship_status,
      items: body.items,
      note: body.note,
      noteTitle: body.noteTitle,
    };

    const response = await axios.post(url, requestData, {
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
          error.response.data?.message || "Failed to create item fulfillment",
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const VALID_FUNCTION_TYPES = ["receipts", "fulfillment"];
const VALID_TRANSACTION_TYPES = [
  "sales_order",
  "transfer_order",
  "vendor_return",
  "purchase_order",
  "customer_return",
];

/**
 * Upload file lampiran (jika ada) ke Nextcloud, lalu queue pembuatan item
 * receipt/fulfillment via bridge API. Netsuite ID hasil bridge API baru
 * didapat di worker (listener), yang kemudian queue proses attach file.
 */
const createFulfillmentReceipts = async (body, user) => {
  try {
    const {
      function_type,
      transaction_type,
      transaction_id,
      items,
      file,
    } = body;

    if (!VALID_FUNCTION_TYPES.includes(function_type)) {
      throw {
        message: `function_type harus salah satu dari: ${VALID_FUNCTION_TYPES.join(", ")}`,
        statusCode: 400,
      };
    }

    if (!VALID_TRANSACTION_TYPES.includes(transaction_type)) {
      throw {
        message: `transaction_type harus salah satu dari: ${VALID_TRANSACTION_TYPES.join(", ")}`,
        statusCode: 400,
      };
    }

    if (!transaction_id) {
      throw { message: "transaction_id tidak boleh kosong", statusCode: 400 };
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw { message: "items tidak boleh kosong", statusCode: 400 };
    }

    const userEmail = user?.email || null;

    let uploadedFile = null;
    if (file) {
      const path = require("path");
      const nextcloud = require("../../utils/nextcloud");

      const extension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, extension);
      const normalizedBaseName = baseName.toLowerCase().replace(/\s+/g, "_");
      const fileNameOriginal = `${Date.now()}_${normalizedBaseName}${extension}`;

      const year = new Date().getFullYear();
      const uploadDir = `/NetSuite/Items/${nextcloud.toPascalCase(transaction_type)}/${year}`;
      const filePath = `${uploadDir}/${fileNameOriginal}`;

      await nextcloud.ensureDirectoryExists(uploadDir);
      await nextcloud.client.putFileContents(filePath, file.buffer);
      const shareUrl = await nextcloud.generateShareLink(filePath);

      uploadedFile = {
        fileName: file.originalname,
        fileNameOriginal,
        storagePath: filePath,
        fileUrl: shareUrl,
      };
    }

    const { publishToRabbitMqQueueSingle } = require("../../config/rabbitmq");
    const { EXCHANGES, QUEUE } = require("../../utils/constant");

    const isReceipts = function_type === "receipts";
    const exchangeName = isReceipts
      ? EXCHANGES.ITEM_RECEIPT_CREATE
      : EXCHANGES.ITEM_FULFILLMENT_CREATE;
    const queueName = isReceipts
      ? QUEUE.ITEM_RECEIPT_CREATE
      : QUEUE.ITEM_FULFILLMENT_CREATE;

    await publishToRabbitMqQueueSingle(
      exchangeName,
      queueName,
      {
        function_type,
        transaction_type,
        transaction_id,
        items,
        note: "created by login email",
        noteTitle: userEmail,
        file: uploadedFile,
        userEmail,
      },
      {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": `${exchangeName}-retry`,
        },
      },
    );

    return {
      function_type,
      transaction_type,
      transaction_id,
      file: uploadedFile
        ? { fileName: uploadedFile.fileName, fileUrl: uploadedFile.fileUrl }
        : null,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    if (error.response) {
      throw {
        message:
          error.response.data?.message ||
          "Failed to queue item receipt/fulfillment",
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getItemsList,
  syncItemsList,
  syncItemById,
  getItemByNetsuiteId,
  processItemsSync,
  getItemLocation,
  getItemReceipts,
  getItemReceiptById,
  createItemReceipt,
  createItemFulfillment,
  createFulfillmentReceipts,
};
