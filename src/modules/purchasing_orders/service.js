const axios = require('axios');
const knex = require('knex');
const authService = require('../auth/service');

// Knex instance untuk DB Netsuite (bridge_sanbox)
const dbNetsuite = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST_NETSUITE || 'localhost',
    port: parseInt(process.env.DB_PORT_NETSUITE) || 9541,
    user: process.env.DB_USER_NETSUITE || 'msiserver',
    password: process.env.DB_PASS_NETSUITE,
    database: process.env.DB_NAME_NETSUITE || 'bridge_sanbox'
  }
});

/**
 * Get purchase orders dari DB Netsuite (bridge_sanbox.purchase_orders)
 * Format response identik dengan format bridge API sebelumnya.
 */
const getPurchaseOrders = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1) * limit;

    // Kolom yang boleh dijadikan sort_by
    const validSortColumns = [
      'po_id', 'po_number', 'po_date', 'po_status', 'vendor_id', 'vendor_name',
      'subsidiary', 'location', 'class', 'department', 'last_modified',
      'foreigntotal', 'total', 'approvalstatus', 'created_at', 'updated_at'
    ];
    let orderCol = validSortColumns.includes(body.sort_by) ? body.sort_by : 'last_modified';
    if (orderCol === 'created_at') {
      orderCol = 'datecreated';
    }

    let query = dbNetsuite('purchase_orders');

    // Filter opsional
    if (body.search) {
      query = query.where(function () {
        this.whereILike('po_number', `%${body.search}%`)
          .orWhereILike('vendor_name', `%${body.search}%`)
          .orWhereILike('memo', `%${body.search}%`);
      });
    }
    if (body.subsidiary) {
      query = query.where('subsidiary', body.subsidiary);
    }
    if (body.location) {
      query = query.where('location', body.location);
    }

    if (body.po_status) {
      query = query.where('po_status', body.po_status);
    }

    if (body.approvalstatus) {
      query = query.where('approvalstatus', body.approvalstatus);
    }

    // Handle classes filter (parent and children)
    let classIds = [];
    if (body.classes) {
      const parentIdStr = body.classes.toString();
      classIds.push(parentIdStr);

      // Step 2 & 3: Cek ke tabel class untuk child yang memiliki parent_id tersebut
      const children = await dbNetsuite('class')
        .select('netsuite_id')
        .where('parent_id', parentIdStr)
        .andWhere('is_delete', false)
        .whereNull('deleted_at');

      // Step 4 & 5: Masukan daftar netsuite_id tersebut
      if (children && children.length > 0) {
        children.forEach(child => {
          if (child.netsuite_id) classIds.push(child.netsuite_id.toString());
        });
      }
    }

    // Step 6: Apply class filter
    if (classIds.length > 0) {
      query = query.whereIn('class', classIds);
    }

    // Hitung total
    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    // Select kolom eksplisit sesuai format response (exclude raw_request, raw_response, id internal)
    const items = await query
      .clone()
      .select([
        'po_id', 'po_number', 'po_date', 'po_status', 'po_status_label',
        'memo', 'vendor_id', 'vendor_name', 'currency_id', 'currency_symbol',
        'foreigntotal', 'total', 'last_modified', 'approvalstatus', 'approvalstatus_display',
        'custbody_me_wf_created_by', 'custbody_me_wf_in_delegation',
        'custbody_me_delegate_approver', 'custbody_msi_createdby_api',
        'custbody_me_pr_date', 'custbody_me_project_location', 'custbody_me_pr_type',
        'custbody_me_saving_type', 'custbody_me_pr_number', 'custbody_me_description',
        'intercotransaction', 'terms', 'terms_display', 'duedate', 'otherrefnum',
        'subsidiary', 'subsidiary_display', 'location', 'location_display',
        'customform', 'customform_display', 'class', 'class_display',
        'nextapprover', 'custbody_me_validity_date', 'department', 'department_display',
        'datecreated as created_at', 'lines'
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };

  } catch (error) {
    throw { message: error.message || 'Failed to fetch purchase orders from database', statusCode: 500 };
  }
};

/**
 * Sync purchase orders — hit bridge API (proses lama dari get-list),
 * hasilnya di-return langsung tanpa disimpan.
 */
const syncPurchaseOrders = async (body) => {
  try {
    // 1. Get token
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch dari bridge API
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/get-list`;

    const filters = {};
    if (body.search) filters.search = body.search;
    if (body.classes) filters.classes = body.classes;
    if (body.subsidiary) filters.subsidiary = body.subsidiary;
    if (body.location) filters.location = body.location;

    const requestData = {
      page: body.page || 1,
      page_size: body.limit || 10,
      sort_by: body.sort_by || 'last_modified',
      sort_order: body.sort_order ? body.sort_order.toUpperCase() : 'DESC',
      filters
    };

    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const resData = response.data;

    // 3. Return dengan format yang sama dengan get-list
    return {
      items: resData.data || resData.items || [],
      pagination: {
        page: resData.page || resData.pageIndex || body.page || 1,
        limit: resData.page_size || resData.pageSize || body.limit || 10,
        total: resData.total_records || resData.totalRows || 0,
        totalPages: resData.total_pages || resData.totalPages || 0
      }
    };

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data.message || 'Failed to sync purchase orders from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const createPurchaseOrder = async (body, user) => {
  const trx = await dbNetsuite.transaction();
  try {
    // Ensure tables exist (optional but good for robustness if they are new)
    // For this task, we assume they are created via migration or exist.

    // 1. create data ke DB netsuite tabel purchase_orders
    const poData = {
      po_number: null, // po_id kosong sesuai permintaan (po_id in DB usually maps to po_number in NetSuite)
      po_date: body.purchasedate,
      po_status: 'pending',
      memo: body.memo,
      vendor_id: body.vendorid,
      vendor_name: body.vendor_name || '', // optional
      subsidiary: body.subsidiary,
      location: body.location,
      currency_id: body.currency,
      terms: body.terms,
      class: body.class,
      custbody_me_pr_date: body.custbody_me_pr_date,
      custbody_me_project_location: body.custbody_me_project_location,
      custbody_me_pr_type: body.custbody_me_pr_type,
      custbody_me_saving_type: body.custbody_me_saving_type,
      custbody_me_pr_number: body.custbody_me_pr_number,
      custbody_msi_createdby_api: body.custbody_msi_createdby_api || user?.email,
      custbody_me_validity_date: body.custbody_me_validity_date,
      lines: JSON.stringify(body.items),
      created_at: new Date(),
      updated_at: new Date()
    };

    const [poInternal] = await trx('purchase_orders').insert(poData).returning('id');
    const poInternalId = typeof poInternal === 'object' ? poInternal.id : poInternal;

    // 2. create satu data ke outbox_events dan satu log awal ke outbox_event_logs
    const eventData = {
      event_type: 'CREATE',
      payload: JSON.stringify(body),
      aggregate_id: poInternalId,
      aggregate_type: 'purchase_order_create',
      status: 'WAITING',
      retry_count: 0,
      max_retry: 3,
      last_error: null,
      properties: JSON.stringify({
        request: body
      }),
      created_at: new Date(),
      updated_at: new Date()
    };

    const [eventIdObj] = await trx('outbox_events').insert(eventData).returning('id');
    const eventId = typeof eventIdObj === 'object' ? eventIdObj.id : eventIdObj;

    // Satu log awal
    await trx('outbox_event_logs').insert({
      outbox_event_id: eventId,
      properties: JSON.stringify({
        response: {
          message: 'Purchase order queued for processing',
          status: 'WAITING'
        }
      }),
      created_at: new Date(),
      updated_at: new Date()
    });

    await trx.commit();

    // 3. buatkan queue untuk rabbit mq untuk memproses data tersebut
    const { publishToRabbitMqQueueSingle } = require('../../config/rabbitmq');
    const { EXCHANGES, QUEUE } = require('../../utils/constant');

    await publishToRabbitMqQueueSingle(
      EXCHANGES.PURCHASE_ORDER_CREATE,
      QUEUE.PURCHASE_ORDER_CREATE,
      {
        event_id: eventId,
        po_internal_id: poInternalId,
        data: body
      },
      {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': `${EXCHANGES.PURCHASE_ORDER_CREATE}-retry`
        }
      }
    );

    return {
      success: true,
      message: 'Purchase order is being processed',
      data: {
        poId: poInternalId,
        event_id: eventId
      }
    };

  } catch (error) {
    if (trx) await trx.rollback();
    throw { message: error.message || 'Failed to initiate purchase order creation', statusCode: 500 };
  }
};

/**
 * Hits the actual bridge API for PO creation (used by worker)
 */
const createPurchaseOrderToBridge = async (body) => {
  const tokenResponse = await authService.getToken();
  const token = tokenResponse.data.access_token;

  const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
  const url = `${baseUrl}/api/v1/bridge/purchase-orders/create`;

  const response = await axios.post(url, body, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  return response.data;
};

/**
 * Hits the actual bridge API for PO update (used by worker)
 */
const updatePurchaseOrderToBridge = async (body) => {
  const tokenResponse = await authService.getToken();
  const token = tokenResponse.data.access_token;

  const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
  const url = `${baseUrl}/api/v1/bridge/purchase-orders/update`;

  const response = await axios.post(url, body, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  return response.data;
};

const updateLocalPOId = async (id, netsuiteId) => {
  // Delete any duplicate data generated passively by api-bridge first
  await dbNetsuite('purchase_orders')
    .where('po_id', netsuiteId)
    .whereNot('id', id)
    .del();

  await dbNetsuite('purchase_orders')
    .where('id', id)
    .update({
      po_id: netsuiteId,
      po_number: netsuiteId, // Assuming po_id column is for NetSuite ID
      updated_at: new Date()
    });
};

const updateLocalPOStatus = async (id, status) => {
  const updateData = { updated_at: new Date() };

  if (status) {
    updateData.po_status = status;
  }

  await dbNetsuite('purchase_orders')
    .where('id', id)
    .update(updateData);
};

const updateEventStatus = async (id, status, result, properties) => {
  const updateData = {
    status: status,
    updated_at: new Date()
  };

  if (result) {
    updateData.properties = JSON.stringify(result);
  }

  await dbNetsuite('outbox_events')
    .where('id', id)
    .update(updateData);

  if (result) {
    await dbNetsuite('outbox_event_logs').insert({
      outbox_event_id: id,
      properties: JSON.stringify({
        response_data: result
      }),
      created_at: new Date(),
      updated_at: new Date()
    });
  }
};

/**
 * Increment retry_count dan update last_error di outbox_events.
 * Return row terbaru setelah update.
 */
const incrementRetryCount = async (id, errorMessage) => {
  const [updated] = await dbNetsuite('outbox_events')
    .where('id', id)
    .update({
      retry_count: dbNetsuite.raw('retry_count + 1'),
      last_error: errorMessage || null,
      status: 'PROCESSING',
      updated_at: new Date()
    })
    .returning(['retry_count', 'max_retry']);
  return updated;
};

/**
 * Cek apakah event masih bisa di-retry otomatis.
 */
const canAutoRetry = async (id) => {
  const event = await dbNetsuite('outbox_events')
    .where('id', id)
    .select('retry_count', 'max_retry')
    .first();
  if (!event) return false;
  return event.retry_count < event.max_retry;
};

/**
 * Ambil status terkini dari outbox_events.
 */
const getEventStatus = async (id) => {
  const event = await dbNetsuite('outbox_events')
    .where('id', id)
    .select('status')
    .first();
  return event ? event.status : null;
};

const logEvent = async (eventId, type, message, data) => {
  const isError = type === 'failed' || type === 'sync_failed' || type === 'retry';

  const responseData = {};
  if (isError) {
    responseData.error = {
      message: message || (data && data.message) || String(data),
      code: data && data.code ? data.code : undefined
    };
  } else {
    responseData.message = message;
    if (data) responseData.data = data;
  }

  await dbNetsuite('outbox_event_logs').insert({
    outbox_event_id: eventId,
    http_status: data && data.statusCode ? String(data.statusCode) : null,
    error: isError ? (message || (data && data.message) || String(data)) : null,
    properties: JSON.stringify({ response: responseData }),
    created_at: new Date(),
    updated_at: new Date()
  });
};

const retryPurchaseOrder = async (id, user, method = 'CREATE') => {
  const po = await dbNetsuite('purchase_orders').where('id', id).first();
  if (!po) throw { message: 'Purchase order not found', statusCode: 404 };

  // Ambil payload dari outbox_events PERTAMA (CREATE event asli) milik PO ini
  // Gunakan .asc() agar kita dapat payload original, bukan payload dari retry sebelumnya
  const firstEvent = await dbNetsuite('outbox_events')
    .where('aggregate_id', id)
    .where('event_type', method)
    .orderBy('created_at', 'desc')
    .first();

  if (!firstEvent || !firstEvent.payload) {
    throw { message: 'Tidak ada payload event yang bisa di-retry untuk PO ini', statusCode: 400 };
  }

  // payload bisa string JSON atau sudah object (tergantung driver pg)
  let rawPayload;
  try {
    rawPayload = typeof firstEvent.payload === 'string' ? JSON.parse(firstEvent.payload) : firstEvent.payload;
  } catch (e) {
    throw { message: `Payload event tidak valid: ${e.message}`, statusCode: 400 };
  }

  // Jika payload punya format { body: {...} }, ambil hanya bagian body-nya
  const body = (rawPayload && typeof rawPayload === 'object' && rawPayload.body)
    ? rawPayload.body
    : rawPayload;

  // Hapus key yang tidak relevan / stale dari payload sebelumnya
  delete body.internalid;   // akan di-inject ulang oleh listener dengan ID yang benar
  delete body._retry_by;    // akan di-set ulang di bawah

  // Reset status ke pending
  if (method === 'CREATE') {
    await dbNetsuite('purchase_orders').where('id', id).update({ po_status: 'pending', updated_at: new Date() });
  } else if (method === 'UPDATE') {
    await dbNetsuite('purchase_orders').where('id', id).update({ updated_at: new Date() });
  }

  // Tambahkan metadata retry
  body._retry_by = user?.email || null;

  // Create new outbox event untuk retry ini
  const [eventIdObj] = await dbNetsuite('outbox_events').insert({
    event_type: method,
    payload: JSON.stringify(body),
    aggregate_id: id,
    aggregate_type: `purchase_order_${method.toLowerCase()}`,
    status: 'WAITING',
    retry_count: 0,
    max_retry: 3,
    last_error: null,
    properties: JSON.stringify({ request: body }),
    created_at: new Date(),
    updated_at: new Date()
  }).returning('id');


  if (method == 'CREATE') {
    const eventId = typeof eventIdObj === 'object' ? eventIdObj.id : eventIdObj;

    await logEvent(eventId, 'purchase_order_retry', 'Manual retry initiated', { retried_by: body._retry_by });

    const { publishToRabbitMqQueueSingle } = require('../../config/rabbitmq');
    const { EXCHANGES, QUEUE } = require('../../utils/constant');

    await publishToRabbitMqQueueSingle(
      EXCHANGES.PURCHASE_ORDER_RETRY,
      QUEUE.PURCHASE_ORDER_MANUAL_RETRY,
      {
        event_id: eventId,
        po_internal_id: id,
        data: body
      },
      {
        durable: true,
        arguments: {}
      }
    );

    return { success: true, message: 'Retry initiated successfully', event_id: eventId };
  } else if (method === 'UPDATE') {
    const eventId = typeof eventIdObj === 'object' ? eventIdObj.id : eventIdObj;

    await logEvent(eventId, 'purchase_order_update', 'Manual retry initiated', { retried_by: body._retry_by });

    const { publishToRabbitMqQueueSingle } = require('../../config/rabbitmq');
    const { EXCHANGES, QUEUE } = require('../../utils/constant');

    await publishToRabbitMqQueueSingle(
      EXCHANGES.PURCHASE_ORDER_UPDATE,
      QUEUE.PURCHASE_ORDER_MANUAL_UPDATE,
      {
        event_id: eventId,
        po_internal_id: id,
        data: body
      },
      {
        durable: true,
        arguments: {}
      }
    );

    return { success: true, message: 'Retry initiated successfully', event_id: eventId };
  }
};

const approvePurchaseOrder = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Hit bridge approval purchase order endpoint
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/approval`;

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data.message || 'Failed to approve purchase order via bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const receiveItemPurchaseOrder = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Hit bridge receive item purchase order endpoint
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/receive-item`;

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Failed to receive item purchase order via bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const getPurchaseOrderById = async (id) => {
  try {
    // Cari dulu berdasarkan po_id (integer/netsuite ID), jika tidak ketemu cari berdasarkan id (UUID)
    let record = await dbNetsuite('purchase_orders')
      .where('po_id', id)
      .first();

    if (!record) {
      // Fallback: cari berdasarkan UUID primary key
      record = await dbNetsuite('purchase_orders')
        .where('id', id)
        .first();
    }

    if (!record) {
      throw { message: `Purchase order dengan id '${id}' tidak ditemukan`, statusCode: 404 };
    }

    // Tambahkan message_error jika status failed
    if (record.po_status === 'failed') {
      const lastEvent = await dbNetsuite('outbox_events')
        .where('aggregate_id', record.id)
        .orderBy('created_at', 'desc')
        .first();

      if (lastEvent && lastEvent.properties) {
        record.message_error = lastEvent.properties;
      }
    }

    return {
      success: true,
      data: record,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    if (error.statusCode) throw error;
    throw { message: error.message || 'Failed to fetch purchase order detail', statusCode: 500 };
  }
};


/**
 * Get receive detail by ID (netsuite_id) from local database
 */
const getReceiveById = async (id) => {
  try {
    const item = await dbNetsuite('receives')
      .select([
        'netsuite_id as receipt_id', 'tranid', 'trandate', 'status', 'status_display',
        'memo', 'vendor_id', 'vendor_name', 'createdfrom', 'createdfrom_display',
        'subsidiary', 'subsidiary_display', 'location', 'location_display',
        'department', 'department_display', 'class', 'class_display',
        'last_modified_netsuite', 'datecreated_netsuite', 'lines'
      ])
      .where('netsuite_id', id)
      .first();

    if (!item) {
      throw { message: 'Data receive tidak ditemukan', statusCode: 404 };
    }

    // Parse lines if it's a string
    if (item.lines && typeof item.lines === 'string') {
      try {
        item.lines = JSON.parse(item.lines);
      } catch (e) {
        item.lines = [];
      }
    }

    return {
      items: [item],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      }
    };
  } catch (error) {
    if (error.statusCode === 404) throw error;
    throw { message: error.message || 'Failed to fetch receive detail from database', statusCode: 500 };
  }
};

const updatePurchaseOrder = async (body, user) => {
  const trx = await dbNetsuite.transaction();
  try {
    const { id } = body;

    const record = await trx('purchase_orders').where('po_id', id).first();

    if (!record) {
      throw { message: `Purchase order dengan ID ${id} tidak ditemukan secara lokal`, statusCode: 404 };
    }

    const localId = record.id;

    // 1. Update data di DB lokal dulu
    const updateData = {
      po_date: body.purchasedate,
      // po_status: 'pending', // reset ke pending saat update berkala
      memo: body.memo,
      vendor_id: body.vendorid,
      subsidiary: body.subsidiary,
      location: body.location,
      currency_id: body.currency,
      terms: body.terms,
      class: body.class,
      department: body.department,
      custbody_me_pr_date: body.custbody_me_pr_date,
      custbody_me_project_location: body.custbody_me_project_location,
      custbody_me_pr_type: body.custbody_me_pr_type,
      custbody_me_saving_type: body.custbody_me_saving_type,
      custbody_me_pr_number: body.custbody_me_pr_number,
      custbody_me_validity_date: body.custbody_me_validity_date,
      lines: JSON.stringify(body.items),
      updated_at: new Date()
    };

    await trx('purchase_orders').where('id', localId).update(updateData);

    // 2. Insert data ke tabel outbox_events dan outbox_event_logs
    const eventData = {
      event_type: 'UPDATE',
      payload: JSON.stringify(body),
      aggregate_id: localId,
      aggregate_type: 'purchase_order_update',
      status: 'WAITING',
      retry_count: 0,
      max_retry: 3,
      last_error: null,
      properties: JSON.stringify({ request: body }),
      created_at: new Date(),
      updated_at: new Date()
    };

    const [eventIdObj] = await trx('outbox_events').insert(eventData).returning('id');
    const eventId = typeof eventIdObj === 'object' ? eventIdObj.id : eventIdObj;

    await trx('outbox_event_logs').insert({
      outbox_event_id: eventId,
      properties: JSON.stringify({
        response: {
          message: 'Update queued for processing',
          status: 'WAITING'
        }
      }),
      created_at: new Date(),
      updated_at: new Date()
    });

    await trx.commit();

    // 3. Menambahkan queue untuk rabbitmq
    const { publishToRabbitMqQueueSingle } = require('../../config/rabbitmq');
    const { EXCHANGES, QUEUE } = require('../../utils/constant');

    await publishToRabbitMqQueueSingle(
      EXCHANGES.PURCHASE_ORDER_UPDATE,
      QUEUE.PURCHASE_ORDER_UPDATE,
      {
        event_id: eventId,
        po_internal_id: localId,
        data: body
      },
      {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': `${EXCHANGES.PURCHASE_ORDER_UPDATE}-retry`
        }
      }
    );

    return {
      success: true,
      message: 'Purchase order update is being processed',
      data: {
        poId: localId,
        event_id: eventId
      }
    };

  } catch (error) {
    if (trx) await trx.rollback();
    throw {
      message: error.message || 'Failed to initiate purchase order update',
      statusCode: error.statusCode || 500,
      errors: error.errors || error
    };
  }
};

/**
 * Sync single purchase order by ID dari bridge API
 * Hit: GET {BRIDGE_BASE_URL}/api/v1/bridge/purchase-orders/sync/{id}/{id}
 */
const syncPurchaseOrderByIdInternalId = async (id, internal_id) => {
  try {
    // 1. Get token
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Hit bridge sync by netsuite_id + internal_id (POST)
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/sync/${id}/${internal_id}`;

    const response = await axios.post(url, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Failed to sync purchase order by ID from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

/**
 * Sync single purchase order by ID dari bridge API
 * Hit: GET {BRIDGE_BASE_URL}/api/v1/bridge/purchase-orders/sync/{id}
 */
const syncPurchaseOrderById = async (id) => {
  try {
    // 1. Get token
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Hit bridge sync by ID endpoint
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/sync/${id}`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Failed to sync purchase order by ID from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const printPurchaseOrder = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Hit bridge print purchase order endpoint
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/print`;

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Failed to print purchase order via bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const getReceiveList = async (body) => {
  try {
    // Jalankan perintah sync ke bridge API terlebih dahulu sesuai instruksi
    try {
      await syncReceiveList(body);
    } catch (syncError) {
      console.warn('Sync failed before fetching getReceiveList:', syncError.message);
    }

    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.page_size || body.limit) || 20;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1) * limit;

    const validSortColumns = ['last_modified_netsuite', 'tranid', 'trandate'];
    const orderCol = validSortColumns.includes(body.sort_by) ? body.sort_by : 'last_modified_netsuite';

    let query = dbNetsuite('receives');

    if (body.filters) {
      if (body.filters.receipt_ids && Array.isArray(body.filters.receipt_ids)) {
        query = query.whereIn('netsuite_id', body.filters.receipt_ids);
      }
      if (body.filters.tranid) {
        query = query.whereILike('tranid', `%${body.filters.tranid}%`);
      }
      if (body.filters.createdfrom_text) {
        query = query.whereILike('createdfrom_display', `%${body.filters.createdfrom_text}%`);
      }
      if (body.filters.createdfrom) {
        query = query.where('createdfrom', body.filters.createdfrom);
      }
      if (body.filters.vendor_id) {
        query = query.where('vendor_id', body.filters.vendor_id);
      }
      if (body.filters.lastmodified) {
        query = query.where('last_modified_netsuite', '>=', body.filters.lastmodified);
      }
    }

    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const items = await query
      .clone()
      .select([
        'netsuite_id as receipt_id', 'tranid', 'trandate', 'status', 'status_display',
        'memo', 'vendor_id', 'vendor_name', 'createdfrom', 'createdfrom_display',
        'subsidiary', 'subsidiary_display', 'location', 'location_display',
        'department', 'department_display', 'class', 'class_display',
        'last_modified_netsuite', 'datecreated_netsuite', 'lines'
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    throw { message: error.message || 'Failed to fetch receive list from database', statusCode: 500 };
  }
};

const syncReceiveList = async (body) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/receives/get-list`;

    const requestData = {
      page: body.page || 1,
      page_size: body.page_size || body.limit || 20,
      sort_by: body.sort_by || 'last_modified',
      sort_order: body.sort_order ? body.sort_order.toUpperCase() : 'DESC',
      filters: body.filters || {}
    };

    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const resData = response.data;
    const items = resData.data?.items || resData.data || [];

    // Sync to local database
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.receipt_id && !item.netsuite_id) continue;

        const receiveData = {
          netsuite_id: item.receipt_id || item.netsuite_id,
          tranid: item.tranid,
          trandate: item.trandate,
          status: item.status,
          status_display: item.status_display,
          memo: item.memo,
          vendor_id: item.vendor_id,
          vendor_name: item.vendor_name,
          createdfrom: item.createdfrom,
          createdfrom_display: item.createdfrom_display,
          subsidiary: item.subsidiary,
          subsidiary_display: item.subsidiary_display,
          location: item.location,
          location_display: item.location_display,
          department: item.department,
          department_display: item.department_display,
          class: item.class,
          class_display: item.class_display,
          last_modified_netsuite: item.last_modified || item.last_modified_netsuite,
          datecreated_netsuite: item.datecreated || item.datecreated_netsuite,
          lines: typeof item.lines === 'string' ? item.lines : JSON.stringify(item.lines),
          updated_at: new Date()
        };

        await dbNetsuite('receives')
          .insert({
            ...receiveData,
            created_at: new Date()
          })
          .onConflict('netsuite_id')
          .merge();
      }
    }

    return {
      items,
      pagination: resData.data?.pagination || {
        page: resData.page || resData.pageIndex || requestData.page,
        limit: resData.page_size || resData.pageSize || requestData.page_size,
        total: resData.total_records || resData.totalRows || 0,
        totalPages: resData.total_pages || resData.totalPages || 0
      }
    };

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data.message || 'Failed to sync receive list from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getPurchaseOrders,
  printPurchaseOrder,
  syncPurchaseOrders,
  createPurchaseOrder,
  approvePurchaseOrder,
  receiveItemPurchaseOrder,
  getReceiveList,
  getReceiveById,
  syncReceiveList,
  getPurchaseOrderById,
  updatePurchaseOrder,
  syncPurchaseOrderById,
  syncPurchaseOrderByIdInternalId,
  updatePurchaseOrderToBridge,
  createPurchaseOrderToBridge,
  logEvent,
  updateLocalPOId,
  updateLocalPOStatus,
  updateEventStatus,
  incrementRetryCount,
  canAutoRetry,
  getEventStatus,
  retryPurchaseOrder
};
