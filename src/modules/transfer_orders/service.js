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
 * Get transfer orders dari DB Netsuite (bridge_sanbox.transfer_orders)
 */
const getTransferOrders = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : "DESC";
    const offset = (page - 1) * limit;

    const validSortColumns = [
      "to_id",
      "trandate",
      "status",
      "subsidiary",
      "location",
      "transferlocation",
      "department",
      "class",
      "created_at",
      "updated_at",
    ];
    const orderCol = validSortColumns.includes(body.sort_by)
      ? body.sort_by
      : "created_at";

    let query = dbNetsuite("transfer_orders as to").where(
      "to.is_delete",
      false,
    );

    if (body.search) {
      query = query.where(function () {
        this.whereILike("to.to_id", `%${body.search}%`).orWhereILike(
          "to.memo",
          `%${body.search}%`,
        );
      });
    }
    if (body.subsidiary) {
      query = query.where("to.subsidiary", body.subsidiary);
    }
    if (body.location) {
      query = query.where("to.location", body.location);
    }
    if (body.transferlocation) {
      query = query.where("to.transferlocation", body.transferlocation);
    }
    if (body.to_status) {
      query = query.where("to.to_status", body.to_status);
    }

    const countResult = await query.clone().count("* as total").first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const items = await query
      .clone()
      .leftJoin("subsidiarys as s", "to.subsidiary", "s.subsidiary_id")
      .leftJoin(
        "locations as l",
        dbNetsuite.raw("to.location = l.netsuite_id::integer"),
      )
      .leftJoin(
        "locations as tl",
        dbNetsuite.raw("to.transferlocation = tl.netsuite_id::integer"),
      )
      .leftJoin(
        "departments as d",
        dbNetsuite.raw("to.department::text = d.netsuite_id::text"),
      )
      .leftJoin(
        "class as c",
        dbNetsuite.raw("to.class::text = c.netsuite_id::text"),
      )
      .select([
        "to.id",
        "to.to_id",
        "to.to_status",
        "to.customform",
        "to.subsidiary",
        "s.subsidiary_name as subsidiary_display",
        "to.location",
        "l.name as location_display",
        "to.transferlocation",
        "tl.name as transferlocation_display",
        "to.trandate",
        "to.memo",
        "to.department",
        "d.name as department_display",
        "to.class",
        "c.name as class_display",
        "to.status",
        "to.incoterm",
        "to.employee",
        "to.custbody_msi_createdby_api",
        "to.created_at",
        "to.updated_at",
      ])
      .orderBy(`to.${orderCol}`, sortOrder)
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
 * Get single transfer order by netsuite_id (to_id) atau UUID id dari DB lokal
 */
const getTransferOrderById = async (id) => {
  try {
    const baseQuery = () =>
      dbNetsuite("transfer_orders as to")
        .where("to.is_delete", false)
        .leftJoin("subsidiarys as s", "to.subsidiary", "s.subsidiary_id")
        .leftJoin(
          "locations as l",
          dbNetsuite.raw("to.location = l.netsuite_id::integer"),
        )
        .leftJoin(
          "locations as tl",
          dbNetsuite.raw("to.transferlocation = tl.netsuite_id::integer"),
        )
        .leftJoin(
          "departments as d",
          dbNetsuite.raw("to.department::text = d.netsuite_id::text"),
        )
        .leftJoin(
          "class as c",
          dbNetsuite.raw("to.class::text = c.netsuite_id::text"),
        )
        .leftJoin(
          "customforms as cf",
          dbNetsuite.raw("to.customform::integer = cf.customform_id"),
        )
        .select([
          "to.id",
          "to.to_id",
          "to.to_status",
          "to.customform",
          "cf.customform_name as customform_display",
          "to.subsidiary",
          "s.subsidiary_name as subsidiary_display",
          "to.location",
          "l.name as location_display",
          "to.transferlocation",
          "tl.name as transferlocation_display",
          "to.trandate",
          "to.memo",
          "to.department",
          "d.name as department_display",
          "to.class",
          "c.name as class_display",
          "to.status",
          "to.incoterm",
          "to.employee",
          "to.custbody_msi_createdby_api",
          "to.lines",
          "to.files",
          "to.created_at",
          "to.updated_at",
        ]);

    // Cari dulu berdasarkan to_id (netsuite internal ID), jika tidak ketemu cari berdasarkan id (UUID)
    let record = await baseQuery().where("to.to_id", id).first();

    if (!record) {
      record = await baseQuery().where("to.id", id).first();
    }

    if (!record) {
      throw {
        message: `Transfer order dengan id '${id}' tidak ditemukan`,
        statusCode: 404,
      };
    }

    if (record.lines) {
      const lines =
        typeof record.lines === "string"
          ? JSON.parse(record.lines)
          : record.lines;
      record.lines = Array.isArray(lines) ? lines : [];
    }

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
 * Sync single transfer order by ID dari bridge API
 * Hit: POST {BRIDGE_BASE_URL}/api/v1/bridge/transfer-orders/sync/{to_id}
 * `id` bisa berupa UUID lokal atau netsuite_id (to_id); akan di-resolve dulu ke to_id.
 */
const syncTransferOrderById = async (id) => {
  try {
    const record = await dbNetsuite("transfer_orders as to")
      .where(function () {
        this.where("to.to_id", id).orWhereRaw("to.id::text = ?", [
          id.toString(),
        ]);
      })
      .first();

    if (!record) {
      throw {
        message: `Transfer order dengan id '${id}' tidak ditemukan secara lokal`,
        statusCode: 404,
      };
    }

    if (!record.to_id) {
      throw {
        message: `Transfer order dengan id '${id}' belum memiliki netsuite ID, tidak bisa di-sync`,
        statusCode: 400,
      };
    }

    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl =
      process.env.BRIDGE_BASE_URL || "https://api-bridge-sb.motorsights.com";
    const url = `${baseUrl}/api/v1/bridge/transfer-orders/sync/${record.to_id}`;

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
    if (error.statusCode) throw error;
    if (error.response) {
      throw {
        message:
          error.response.data?.message ||
          "Failed to sync transfer order by ID from bridge API",
        statusCode: error.response.status,
        errors: error.response.data,
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

/**
 * Initiate Transfer Order creation process (Async via Outbox Pattern)
 */
const createTransferOrder = async (body, user, userId) => {
  const trx = await dbNetsuite.transaction();
  try {
    // 1. create data ke DB netsuite tabel transfer_orders
    const toData = {
      to_number: null,
      to_status: "pending",
      customform: body.customform,
      subsidiary: body.subsidiary,
      location: body.location,
      transferlocation: body.transferlocation,
      trandate: body.trandate,
      memo: body.memo,
      department: body.department,
      class: body.class,
      status: body.status,
      incoterm: body.incoterm,
      employee: body.employee,
      custbody_msi_createdby_api:
        body.custbody_msi_createdby_api || user?.email,
      lines: JSON.stringify(body.items),
      files: body.files ? JSON.stringify(body.files) : null,
      created_by: userId,
      created_at: new Date(),
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
 * Hits the actual bridge API for Transfer Order creation (used by worker)
 */
const createTransferOrderToBridge = async (body) => {
  const tokenResponse = await authService.getToken();
  const token = tokenResponse.data.access_token;

  const baseUrl =
    process.env.BRIDGE_BASE_URL || "https://api-bridge-sb.motorsights.com";
  const url = `${baseUrl}/api/v1/bridge/transfer-orders/create`;

  const response = await axios.post(url, body, {
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
        this.where("to_id", id).orWhereRaw("id::text = ?", [id]);
      })
      .first();

    if (!record) {
      throw {
        message: `Transfer order dengan ID ${id} tidak ditemukan secara lokal`,
        statusCode: 404,
      };
    }

    const localId = record.id;
    const netsuiteId = record.to_id;
    const is_update = record.to_id ? true : false;

    // 1. Update data di DB lokal dulu
    const updateData = {
      customform: body.customform,
      subsidiary: body.subsidiary,
      location: body.location,
      transferlocation: body.transferlocation,
      trandate: body.trandate,
      memo: body.memo,
      department: body.department,
      class: body.class,
      status: body.status,
      incoterm: body.incoterm,
      employee: body.employee,
      custbody_msi_createdby_api:
        body.custbody_msi_createdby_api || user?.email,
      lines: JSON.stringify(body.items),
      files: body.files ? JSON.stringify(body.files) : null,
      updated_at: new Date(),
      updated_by: userId,
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

  const response = await axios.post(url, body, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    timeout: 1500000,
  });

  return response.data;
};

const updateLocalTOStatus = async (id, status) => {
  const updateData = { updated_at: new Date() };

  if (status) {
    updateData.to_status = status;
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

module.exports = {
  getTransferOrders,
  getTransferOrderById,
  syncTransferOrderById,
  createTransferOrder,
  createTransferOrderToBridge,
  updateTransferOrder,
  updateTransferOrderToBridge,
  updateLocalTOStatus,
  updateEventStatus,
  incrementRetryCount,
  canAutoRetry,
  getEventStatus,
  logEvent,
};
