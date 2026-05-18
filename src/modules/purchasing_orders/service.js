const axios = require('axios');
const knex = require('knex');
const authService = require('../auth/service');
const { pgCore } = require('../../config/database');

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
      orderCol = dbNetsuite.raw("COALESCE(NULLIF(po.datecreated, '')::timestamp, po.created_at)");
    } else {
      orderCol = `po.${orderCol}`;
    }

    let query = dbNetsuite('purchase_orders as po');

    // Filter opsional
    if (body.search) {
      query = query.where(function () {
        this.whereILike('po.po_id', `%${body.search}%`)
          .orWhereILike('po.po_number', `%${body.search}%`)
          .orWhereILike('po.vendor_name', `%${body.search}%`)
          .orWhereILike('po.memo', `%${body.search}%`);
      });
    }
    if (body.subsidiary) {
      query = query.where('po.subsidiary', body.subsidiary);
    }
    if (body.location) {
      query = query.where('po.location', body.location);
    }

    if (body.po_status) { //filter kolom dispay saja
      query = query.where('po.po_status_label', body.po_status);
    }

    if (body.approvalstatus) { //filter kolom dispay saja
      query = query.where('po.approvalstatus_display', body.approvalstatus);
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
      query = query.whereIn('po.class', classIds);
    }

    // Hitung total
    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    // Select kolom sesuai SQL user
    const items = await query
      .clone()
      .leftJoin('vendors as v', dbNetsuite.raw('po.vendor_id = v.netsuite_id::integer'))
      .leftJoin('subsidiarys as s', 'po.subsidiary', 's.subsidiary_id')
      .leftJoin('locations as l', dbNetsuite.raw('po.location = l.netsuite_id::integer'))
      .leftJoin('class as c2', dbNetsuite.raw('po.class::text = c2.netsuite_id::text'))
      .select([
        'po.id',
        'po.po_id',
        dbNetsuite.raw("COALESCE(NULLIF(po.subsidiary_display, ''), s.subsidiary_name) AS subsidiary_display"),
        'po.po_number',
        'po.po_date',
        dbNetsuite.raw("COALESCE(NULLIF(po.vendor_name, ''), v.name) AS vendor_name"),
        'po.custbody_me_pr_number',
        dbNetsuite.raw("COALESCE(NULLIF(po.location_display, ''), l.name) AS location_display"),
        dbNetsuite.raw("COALESCE(NULLIF(po.class_display, ''), c2.name) AS class_display"),
        'po.approvalstatus',
        'po.approvalstatus_display',
        'po.nextapprover',
        'po.po_status',
        'po.po_status_label',
        'po.memo',
        'po.total',
        'po.custbody_msi_createdby_api',
        'po.last_modified',
        dbNetsuite.raw("COALESCE(NULLIF(po.datecreated, '')::timestamp, po.created_at) AS created_at"),
        'po.currency_symbol',
        'po.files'
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
      is_sync: true,
      filters
    };

    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 120000
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
      department: body.department,
      customform: body.customform,
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
      files: body.files ? JSON.stringify(body.files) : null,
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
      created_at: poData.created_at,
      updated_at: poData.updated_at
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
      created_at: poData.created_at,
      updated_at: poData.updated_at
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
    },
    timeout: 120000
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
    },
    timeout: 120000
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

  const finalProperties = properties || result;
  if (finalProperties) {
    updateData.properties = typeof finalProperties === 'string' ? JSON.stringify({ message: finalProperties }) : JSON.stringify(finalProperties);
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
  const trx = await dbNetsuite.transaction();
  try {
    const { id, recordType, note } = body;

    let localPoId = null;
    const poRecord = await trx('purchase_orders').where('po_id', id).first();
    if (poRecord) {
      localPoId = poRecord.id;
    }

    // 1. create data ke DB netsuite tabel purchase_order_noteds
    let transactionType = null;
    if (body.custbody_msi_submit_app_api === true) transactionType = 'custbody_msi_submit_app_api';
    else if (body.custbody_msi_reopen_api === true) transactionType = 'custbody_msi_reopen_api';
    else if (body.custbody_msi_resubmit_api === true) transactionType = 'custbody_msi_resubmit_api';

    const notedData = {
      netsuite_id: null,
      transaction: transactionType,
      note: note,
      purchase_order_id: id,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    const [notedInternal] = await trx('purchase_order_noteds').insert(notedData).returning('id');
    const notedInternalId = typeof notedInternal === 'object' ? notedInternal.id : notedInternal;

    // 2. create di tabel outbox_events dan outbox_event_logs
    const eventData = {
      event_type: 'CREATE',
      payload: JSON.stringify(body),
      aggregate_id: notedInternalId,
      aggregate_type: 'purchase_order_approval',
      status: 'WAITING',
      retry_count: 0,
      max_retry: 3,
      last_error: null,
      properties: JSON.stringify({
        request: body
      }),
      created_at: notedData.created_at,
      updated_at: notedData.updated_at
    };

    const [eventIdObj] = await trx('outbox_events').insert(eventData).returning('id');
    const eventId = typeof eventIdObj === 'object' ? eventIdObj.id : eventIdObj;

    await trx('outbox_event_logs').insert({
      outbox_event_id: eventId,
      properties: JSON.stringify({
        response: {
          message: 'Purchase order approval queued for processing',
          status: 'WAITING'
        }
      }),
      created_at: notedData.created_at,
      updated_at: notedData.updated_at
    });

    await trx.commit();

    // 3. buatkan antrian rabbit mq
    const { publishToRabbitMqQueueSingle } = require('../../config/rabbitmq');
    const { EXCHANGES, QUEUE } = require('../../utils/constant');

    await publishToRabbitMqQueueSingle(
      EXCHANGES.PURCHASE_ORDER_APPROVAL,
      QUEUE.PURCHASE_ORDER_APPROVAL,
      {
        event_id: eventId,
        noted_internal_id: notedInternalId,
        data: body
      },
      {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': `${EXCHANGES.PURCHASE_ORDER_APPROVAL}-retry`
        }
      }
    );

    return {
      success: true,
      message: 'Purchase order approval is being processed',
      data: {
        notedId: notedInternalId,
        event_id: eventId
      }
    };

  } catch (error) {
    if (trx) await trx.rollback();
    throw { message: error.message || 'Failed to initiate purchase order approval', statusCode: 500 };
  }
};

const approvePurchaseOrderToBridge = async (noted_internal_id, body) => {
  const tokenResponse = await authService.getToken();
  const token = tokenResponse.data.access_token;

  const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
  const url = `${baseUrl}/api/v1/bridge/purchase-orders/approval`;

  const payload = {
    ...body,
    noted_internal_id: noted_internal_id || null
  }

  const response = await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    timeout: 120000
  });

  return response.data;
};

const updatePurchaseOrderNotedsStatus = async (id, status) => {
  await dbNetsuite('purchase_order_noteds')
    .where('id', id)
    .update({
      status: status,
      updated_at: new Date()
    });
};

const receiveItemPurchaseOrder = async (body, user) => {
  const trx = await dbNetsuite.transaction();
  try {
    // 1. create data ke DB netsuite tabel receives (initial state)
    const receiveData = {
      createdfrom: body.po_id, // po_id integer
      customform: body.customform || null,
      trandate: body.trandate || null,
      class: body.class || null,
      location: body.location || null,
      department: body.department || null,
      status: 'pending',
      memo: body.memo || null,
      created_by_name: body.created_by_name || user?.name || user?.full_name || user?.email || null,
      created_by: body.created_by || user?.id || null,
      lines: JSON.stringify(body.items),
      created_at: new Date(),
      updated_at: new Date()
    };

    const [receiveInternal] = await trx('receives').insert(receiveData).returning('id');
    const receiveInternalId = typeof receiveInternal === 'object' ? receiveInternal.id : receiveInternal;

    // 2. create satu data ke outbox_events dan satu log awal
    const eventData = {
      event_type: 'CREATE',
      payload: JSON.stringify(body),
      aggregate_id: receiveInternalId,
      aggregate_type: 'purchase_order_receive_item',
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

    await trx('outbox_event_logs').insert({
      outbox_event_id: eventId,
      properties: JSON.stringify({
        response: {
          message: 'Item receipt queued for processing',
          status: 'WAITING'
        }
      }),
      created_at: new Date(),
      updated_at: new Date()
    });

    await trx.commit();

    // 3. buatkan queue untuk rabbit mq
    const { publishToRabbitMqQueueSingle } = require('../../config/rabbitmq');
    const { EXCHANGES, QUEUE } = require('../../utils/constant');

    await publishToRabbitMqQueueSingle(
      EXCHANGES.PURCHASE_ORDER_RECEIVE,
      QUEUE.PURCHASE_ORDER_RECEIVE,
      {
        event_id: eventId,
        receive_internal_id: receiveInternalId,
        data: body
      },
      {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': `${EXCHANGES.PURCHASE_ORDER_RECEIVE}-retry`
        }
      }
    );

    return {
      success: true,
      message: 'Item receipt is being processed',
      data: {
        receiptId: receiveInternalId,
        event_id: eventId
      }
    };

  } catch (error) {
    if (trx) await trx.rollback();
    throw { message: error.message || 'Failed to initiate item receipt', statusCode: 500 };
  }
};

/**
 * Hits the actual bridge API for Item Receipt (used by worker)
 */
const receiveItemPurchaseOrderToBridge = async (body, internalId) => {
  const tokenResponse = await authService.getToken();
  const token = tokenResponse.data.access_token;

  const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
  const url = `${baseUrl}/api/v1/bridge/purchase-orders/receive-item`;

  const payload = {
    ...body,
    internal_id: internalId
  };

  const response = await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    timeout: 120000
  });

  return response.data;
};

const getPurchaseOrderById = async (id) => {
  try {
    const baseQuery = () => dbNetsuite('purchase_orders as po')
      // JOIN HEADER MASTER
      .leftJoin('vendors as v', dbNetsuite.raw('po.vendor_id = v.netsuite_id::integer'))
      .leftJoin('terms as t', dbNetsuite.raw('po.terms = t.netsuite_id::integer'))
      .leftJoin('subsidiarys as s', 'po.subsidiary', 's.subsidiary_id')
      .leftJoin('locations as l', dbNetsuite.raw('po.location = l.netsuite_id::integer'))
      .leftJoin('customforms as c', dbNetsuite.raw('po.customform::integer = c.customform_id'))
      .leftJoin('class as c2', dbNetsuite.raw('po.class::text = c2.netsuite_id::text'))
      .leftJoin('departments as d', dbNetsuite.raw('po.department::text = d.netsuite_id::text'))
      .leftJoin('currencys as c3', dbNetsuite.raw('po.currency_id::integer = c3.currency_id'))

      // EXPLODE JSON & JOIN MASTER DARI JSON
      .leftJoin(dbNetsuite.raw("LATERAL jsonb_array_elements(COALESCE(po.lines, '[]'::jsonb)) AS line ON TRUE"))
      .leftJoin('items as i', dbNetsuite.raw("(line->>'item') = i.netsuite_id::text"))
      .leftJoin('items as i2', dbNetsuite.raw("(line->>'itemId') = i2.netsuite_id::text"))
      .leftJoin('class as c_line', dbNetsuite.raw("(line->>'class') = c_line.netsuite_id::text"))
      .leftJoin('locations as l_line', dbNetsuite.raw("(line->>'location') = l_line.netsuite_id::text"))
      .leftJoin('departments as d_line', dbNetsuite.raw("(line->>'department') = d_line.netsuite_id::text"))
      .leftJoin('taxcodes as t_line', dbNetsuite.raw("(line->>'taxcode') = t_line.taxcode_id::text"))

      .select([
        'po.id', 'po.po_id', 'po.po_number', 'po.po_date', 'po.po_status', 'po.po_status_label',
        'po.memo', 'po.vendor_id',
        dbNetsuite.raw("COALESCE(NULLIF(po.vendor_name, ''), v.name) AS vendor_name"),
        'po.currency_id',
        dbNetsuite.raw("COALESCE(NULLIF(po.currency_symbol, ''), c3.currency_name) AS currency_symbol"),
        'po.foreigntotal', 'po.total',
        'po.last_modified', 'po.approvalstatus', 'po.approvalstatus_display',
        'po.custbody_me_wf_created_by', 'po.custbody_me_wf_in_delegation',
        'po.custbody_me_delegate_approver', 'po.custbody_msi_createdby_api',
        'po.custbody_me_pr_date', 'po.custbody_me_project_location', 'po.custbody_me_pr_type',
        'po.custbody_me_saving_type', 'po.custbody_me_pr_number', 'po.custbody_me_description',
        'po.intercotransaction', 'po.terms',
        dbNetsuite.raw("COALESCE(NULLIF(po.terms_display, ''), t.name) AS terms_display"),
        'po.duedate', 'po.otherrefnum', 'po.subsidiary',
        dbNetsuite.raw("COALESCE(NULLIF(po.subsidiary_display, ''), s.subsidiary_name) AS subsidiary_display"),
        'po.location',
        dbNetsuite.raw("COALESCE(NULLIF(po.location_display, ''), l.name) AS location_display"),
        'po.customform',
        dbNetsuite.raw("COALESCE(NULLIF(po.customform_display, ''), c.customform_name) AS customform_display"),
        'po.class',
        dbNetsuite.raw("COALESCE(NULLIF(po.class_display, ''), c2.name) AS class_display"),
        'po.nextapprover', 'po.custbody_me_validity_date', 'po.department',
        dbNetsuite.raw("COALESCE(NULLIF(po.department_display, ''), d.name) AS department_display"),
        dbNetsuite.raw("COALESCE(NULLIF(po.datecreated, '')::timestamp, po.created_at) AS created_at"),
        'po.custbody_me_wf_next_approver_blank', 'po.custbody_me_wf_next_approver_blank_display', 'po.user_notes', 'po.files',
        dbNetsuite.raw(`
          jsonb_agg(
            jsonb_build_object(
                'line_id', line->>'line_id',
                'linesequencenumber', line->>'linesequencenumber',
                'inbound_shipment_number', line->>'inbound_shipment_number',
                'inbound_shipment_line_id', line->>'inbound_shipment_line_id',
                'has_inbound', line->>'has_inbound',
                'item', COALESCE(
                    NULLIF(line->>'item', ''),
                    line->>'itemId'
                ),
                'item_display', COALESCE(
                    NULLIF(line->>'item_display', ''),
                    COALESCE(
                        NULLIF(i.item_id, ''),
                        i2.item_id
                    )
                ),
                'quantity', COALESCE(
                    NULLIF(line->>'quantity', ''),
                    line->>'qty'
                ),
                'quantityreceived', line->>'quantityreceived',
                'quantitypending',  (COALESCE(NULLIF(line->>'quantity', ''), line->>'qty')::numeric - COALESCE(NULLIF(line->>'quantityreceived', ''), '0')::numeric),
                'rate', line->>'rate',
                'netamount', line->>'netamount',
                'grossamt', line->>'grossamt',
                'department', line->>'department',
                'department_display', d_line.name,
                'class', line->>'class',
                'class_display', c_line.name,
                'location', line->>'location',
                'location_display', l_line.name,
                'taxcode', line->>'taxcode',
                'taxcode_display', t_line.taxcode_name,
                'taxrate1', line->>'taxrate1',
                'tax1amt', line->>'tax1amt',
                'custcol_me_landed_cost', line->>'custcol_me_landed_cost',
                'custcol_msi_fob', line->>'custcol_msi_fob',
                'description', line->>'description',
                'amount', line->>'netamount',
                'tax_amount', line->>'tax1amt'
            )
          ) FILTER (WHERE line IS NOT NULL) AS lines
        `),
        dbNetsuite.raw("COUNT(line) AS count_item"),
        dbNetsuite.raw("SUM((line->>'quantity')::numeric) AS sum_quantity"),
        dbNetsuite.raw("SUM((line->>'netamount')::numeric) AS subtotal"),
        dbNetsuite.raw("SUM((line->>'tax1amt')::numeric) AS tax_total")
      ])
      .groupBy([
        'po.id',
        'v.name',
        't.name',
        's.subsidiary_name',
        'l.name',
        'c.customform_name',
        'c2.name',
        'd.name',
        'c3.currency_name',
      ]);

    // Cari dulu berdasarkan po_id (integer/netsuite ID), jika tidak ketemu cari berdasarkan id (UUID)
    let record = await baseQuery()
      .where('po.po_id', id)
      .first();

    if (!record) {
      // Fallback: cari berdasarkan UUID primary key
      record = await baseQuery()
        .where('po.id', id)
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

    if (record && record.lines) {
      // record.sum_quantity = parseFloat(record.lines.reduce((sum, line) => sum + (parseFloat(line.quantity) || 0), 0));
      // record.count_items = record.lines.length;
      // record.subtotal = parseFloat(record.lines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0).toFixed(2));
      // record.total_tax = parseFloat(record.lines.reduce((sum, line) => sum + (parseFloat(line.tax_amount) || 0), 0).toFixed(2));
      //ini untuk hide respon line
      // delete record.lines;
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
    const baseQuery = () => dbNetsuite('receives as r')
      .leftJoin('vendors as v', dbNetsuite.raw('r.vendor_id::integer = v.netsuite_id::integer'))
      .leftJoin('customforms as c', dbNetsuite.raw('c.customform_id::integer = r.createdfrom::integer'))
      .leftJoin('subsidiarys as s', dbNetsuite.raw('s.subsidiary_id::integer = r.subsidiary::integer'))
      .leftJoin('locations as l', dbNetsuite.raw('l.netsuite_id::integer = r.location::integer'))
      .leftJoin('departments as d', dbNetsuite.raw('d.netsuite_id::integer = r.department::integer'))
      .leftJoin('class as c2', dbNetsuite.raw('c2.netsuite_id::integer = r.class::integer'))
      // Joins for lines lines enrichment
      .leftJoin(dbNetsuite.raw("LATERAL jsonb_array_elements(COALESCE(r.lines, '[]'::jsonb)) AS line ON TRUE"))
      .leftJoin('items as i', dbNetsuite.raw("(line->>'item') = i.netsuite_id::text"))
      .leftJoin('class as c_line', dbNetsuite.raw("(line->>'class') = c_line.netsuite_id::text"))
      .leftJoin('locations as l_line', dbNetsuite.raw("(line->>'location') = l_line.netsuite_id::text"))
      .leftJoin('departments as d_line', dbNetsuite.raw("(line->>'department') = d_line.netsuite_id::text"))
      .select([
        'r.id',
        'r.netsuite_id as receipt_id',
        'r.tranid',
        'r.trandate',
        'r.status',
        'r.status_display',
        'r.memo',
        'r.vendor_id',
        dbNetsuite.raw("COALESCE(NULLIF(r.vendor_name, ''), v.name) AS vendor_name"),
        'r.createdfrom',
        dbNetsuite.raw("COALESCE(NULLIF(r.createdfrom_display, ''), c.customform_name) AS createdfrom_display"),
        'r.subsidiary',
        dbNetsuite.raw("COALESCE(NULLIF(r.subsidiary_display, ''), s.subsidiary_name) AS subsidiary_display"),
        'r.location',
        dbNetsuite.raw("COALESCE(NULLIF(r.location_display, ''), l.name) AS location_display"),
        'r.department',
        dbNetsuite.raw("COALESCE(NULLIF(r.department_display, ''), d.name) AS department_display"),
        'r.class',
        dbNetsuite.raw("COALESCE(NULLIF(r.class_display, ''), c2.name) AS class_display"),
        'r.last_modified_netsuite',
        'r.datecreated_netsuite',
        'r.created_at',
        'r.updated_at',
        dbNetsuite.raw(`
          jsonb_agg(
            jsonb_build_object(
                'item', line->>'item',
                'line', COALESCE(
                    NULLIF(line->>'line', ''),
                    line->>'line_sequence'
                ),
                'memo', line->>'memo',
                'rate', line->>'rate',
                'class', line->>'class',
                'amount', line->>'amount',
                'location', line->>'location',
                'quantity', line->>'quantity',
                'department', line->>'department',
                'item_display', COALESCE(NULLIF(line->>'item_display', ''), i.display_name),
                'class_display', COALESCE(NULLIF(line->>'class_display', ''), c_line.name),
                'inventorydetail', line->>'inventorydetail',
                'location_display', COALESCE(NULLIF(line->>'location_display', ''), l_line.name),
                'department_display', COALESCE(NULLIF(line->>'department_display', ''), d_line.name)
            )
          ) FILTER (WHERE line IS NOT NULL) AS lines
        `)
      ])
      .groupBy([
        'r.id', 'v.name', 'c.customform_name', 's.subsidiary_name', 'l.name', 'd.name', 'c2.name'
      ]);

    // Cari dulu berdasarkan receipt_id (netsuite ID) jika numeric, lalu fallback ke UUID (id)
    let item;
    if (/^\d+$/.test(id)) {
      item = await baseQuery()
        .where('r.netsuite_id', id)
        .first();
    }

    if (!item) {
      // Fallback: cari berdasarkan UUID primary key atau ID string
      item = await baseQuery()
        .where('r.id', id)
        .first();
    }

    if (!item) {
      throw { message: 'Data receive tidak ditemukan', statusCode: 404 };
    }

    return {
      items: [item],
      pagination: {
        page: 1,
        limit: 1,
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
      files: body.files ? JSON.stringify(body.files) : null,
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
      },
      timeout: 120000
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

/**
 * Batch sync purchase orders by ID based on status 'pendingBillPartReceived'
 * POST /api/purchasing-orders/sync/byidall
 */
const syncPurchaseOrdersByIdAll = async () => {
  try {
    // 1. Ambil po_id dari tabel purchase_orders yang po_status = pendingBillPartReceived
    const pendingPOs = await dbNetsuite('purchase_orders')
      .where('po_status', 'pendingBillPartReceived')
      .select('po_id');

    const poIds = pendingPOs
      .map(po => po.po_id)
      .filter(id => id !== null && id !== '');

    if (poIds.length === 0) {
      return {
        success: true,
        message: 'Tidak ada purchase order dengan status pendingBillPartReceived untuk di-sync.',
        data: {
          success: true,
          po_ids: []
        }
      };
    }

    // 2. Get token
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 3. Hit bridge API: POST /api/v1/bridge/purchase-orders/sync/findById
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/sync/findById`;

    const response = await axios.post(url, { po_ids: poIds }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 120000
    });

    return response.data;

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Failed to sync all purchase orders from bridge API',
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
      },
      timeout: 120000
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
    // try {
    //   await syncReceiveList(body);
    // } catch (syncError) {
    //   console.warn('Sync failed before fetching getReceiveList:', syncError.message);
    // }

    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit || body.page_size) || 20;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1) * limit;

    const validSortColumns = ['last_modified_netsuite', 'tranid', 'trandate', 'created_at', 'updated_at'];
    let orderCol = validSortColumns.includes(body.sort_by) ? body.sort_by : 'last_modified_netsuite';
    orderCol = `r.${orderCol}`;

    let query = dbNetsuite('receives as r');

    query = query.whereNotNull('r.netsuite_id');

    // 1. New Search Logic (Search across multiple columns)
    if (body.search) {
      query = query.where(function () {
        this.whereILike('r.tranid', `%${body.search}%`)
          .orWhereILike('r.vendor_name', `%${body.search}%`)
          .orWhereILike('r.createdfrom', `%${body.search}%`)
          .orWhereILike('r.subsidiary_display', `%${body.search}%`)
          .orWhereILike('r.location_display', `%${body.search}%`);
      });
    }

    // 2. Specialized filters (support both root and legacy body.filters)
    const filters = body.filters || {};

    // Receipt IDs
    const receiptIds = body.receipt_ids || filters.receipt_ids;
    if (receiptIds && Array.isArray(receiptIds)) {
      query = query.whereIn('r.netsuite_id', receiptIds);
    }

    // Tran ID
    const tranid = body.tranid || filters.tranid;
    if (tranid) {
      query = query.whereILike('r.tranid', `%${tranid}%`);
    }

    // Created From Display (text)
    const createdFromText = body.createdfrom_text || filters.createdfrom_text;
    if (createdFromText) {
      query = query.whereILike('r.createdfrom_display', `%${createdFromText}%`);
    }

    // Created From (ID)
    const createdFrom = body.createdfrom || filters.createdfrom;
    if (createdFrom) {
      query = query.where('r.createdfrom', createdFrom);
    }

    // Vendor ID
    const vendorId = body.vendor_id || filters.vendor_id;
    if (vendorId) {
      query = query.where('r.vendor_id', vendorId);
    }

    // Subsidiary
    const subsidiary = body.subsidiary || filters.subsidiary;
    if (subsidiary) {
      query = query.where('r.subsidiary', subsidiary);
    }

    // Location
    const location = body.location || filters.location;
    if (location) {
      query = query.where('r.location', location);
    }

    // Handle classes filter (parent and children)
    let classIds = [];
    const classes = body.classes || filters.classes;
    if (classes) {
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
      query = query.whereIn('r.class', classIds);
    }

    // Last Modified (Date)
    const lastModified = body.lastmodified || filters.lastmodified;
    if (lastModified) {
      query = query.where('r.last_modified_netsuite', '>=', lastModified);
    }

    const countResult = await query.clone().count('r.id as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const items = await query
      .clone()
      .leftJoin('vendors as v', dbNetsuite.raw('r.vendor_id::integer = v.netsuite_id::integer'))
      .leftJoin('customforms as c', dbNetsuite.raw('c.customform_id::integer = r.createdfrom::integer'))
      .leftJoin('subsidiarys as s', dbNetsuite.raw('s.subsidiary_id::integer = r.subsidiary::integer'))
      .leftJoin('locations as l', dbNetsuite.raw('l.netsuite_id::integer = r.location::integer'))
      .leftJoin('departments as d', dbNetsuite.raw('d.netsuite_id::integer = r.department::integer'))
      .leftJoin('class as c2', dbNetsuite.raw('c2.netsuite_id::integer = r.class::integer'))

      .select([
        'r.id',
        'r.netsuite_id as receipt_id',
        'r.tranid',
        'r.trandate',
        'r.status',
        'r.status_display',
        'r.memo',
        'r.vendor_id',
        dbNetsuite.raw("COALESCE(NULLIF(r.vendor_name, ''), v.name) AS vendor_name"),
        'r.createdfrom',
        dbNetsuite.raw("COALESCE(NULLIF(r.createdfrom_display, ''), c.customform_name) AS createdfrom_display"),
        'r.subsidiary',
        dbNetsuite.raw("COALESCE(NULLIF(r.subsidiary_display, ''), s.subsidiary_name) AS subsidiary_display"),
        'r.location',
        dbNetsuite.raw("COALESCE(NULLIF(r.location_display, ''), l.name) AS location_display"),
        'r.department',
        dbNetsuite.raw("COALESCE(NULLIF(r.department_display, ''), d.name) AS department_display"),
        'r.class',
        dbNetsuite.raw("COALESCE(NULLIF(r.class_display, ''), c2.name) AS class_display"),
        'r.last_modified_netsuite',
        'r.datecreated_netsuite',
        'r.created_at',
        'r.created_by_name',
        'r.updated_at'
      ])
      .groupBy([
        'r.id', 'v.name', 'c.customform_name', 's.subsidiary_name', 'l.name', 'd.name', 'c2.name'
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
      },
      timeout: 120000
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

const updateLocalReceive = async (internalId, data) => {
  try {
    const updateData = {
      netsuite_id: data.id || data.netsuite_id,
      tranid: data.tranid,
      trandate: data.trandate,
      status: data.status || 'success',
      status_display: data.status_display,
      memo: data.memo,
      vendor_id: data.vendor_id,
      vendor_name: data.vendor_name,
      createdfrom: data.po_id || data.createdfrom,
      createdfrom_display: data.po_number || data.createdfrom_display,
      subsidiary: data.subsidiary,
      subsidiary_display: data.subsidiary_display,
      location: data.location,
      location_display: data.location_display,
      department: data.department,
      department_display: data.department_display,
      class: data.class,
      class_display: data.class_display,
      last_modified_netsuite: data.last_modified || data.last_modified_netsuite || new Date(),
      datecreated_netsuite: data.datecreated || data.datecreated_netsuite || new Date(),
      updated_at: new Date()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    await dbNetsuite('receives')
      .where('id', internalId)
      .update(updateData);

    return true;
  } catch (error) {
    console.error(`[Service] Failed to update local receive ${internalId}:`, error.message);
    return false;
  }
};

const getReceiveHistoryLogs = async (body) => {
  try {
    const { createdfrom } = body;
    if (!createdfrom) {
      throw { message: 'Parameter createdfrom tidak boleh kosong', statusCode: 400 };
    }

    const results = await dbNetsuite('receives as r')
      .join('outbox_events as oe', 'oe.aggregate_id', 'r.id')
      .select([
        'r.id',
        'r.trandate',
        'oe.last_error as msg_error',
        'r.created_at',
        'r.created_by_name'
      ])
      .where('oe.status', 'FAILED')
      .where('oe.aggregate_type', 'purchase_order_receive_item')
      .where('r.createdfrom', createdfrom.toString())
      .groupBy(['r.id', 'oe.last_error']);

    return results;
  } catch (error) {
    throw { message: error.message || 'Failed to fetch receive history logs', statusCode: error.statusCode || 500 };
  }
};

const getItems = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1) * limit;
    const poId = body.po_id;
    const internalId = body.internal_id;

    if (!poId && !internalId) {
      throw { message: 'po_id atau internal_id is required', statusCode: 400 };
    }

    let query = dbNetsuite('purchase_orders as po')
      .crossJoin(dbNetsuite.raw("jsonb_array_elements(CASE WHEN po.lines IS NULL OR po.lines::text = '' OR po.lines::text = 'null' THEN '[]'::jsonb ELSE po.lines::jsonb END) AS line"))
      .leftJoin('items as i', dbNetsuite.raw("(line->>'item') = i.netsuite_id::text"))
      .leftJoin('items as i2', dbNetsuite.raw("(line->>'itemId') = i2.netsuite_id::text"))
      .leftJoin('class as c_line', dbNetsuite.raw("(line->>'class') = c_line.netsuite_id::text"))
      .leftJoin('locations as l_line', dbNetsuite.raw("(line->>'location') = l_line.netsuite_id::text"))
      .leftJoin('departments as d_line', dbNetsuite.raw("(line->>'department') = d_line.netsuite_id::text"))
      .leftJoin('taxcodes as t_line', dbNetsuite.raw("(line->>'taxcode') = t_line.taxcode_id::text"));

    if (poId) {
      query = query.where('po.po_id', poId);
    }

    if (internalId) {
      query = query.where('po.id', internalId);
    }


    if (body.search) {
      query = query.where(function () {
        this.whereRaw("line->>'item_display' ILIKE ?", [`%${body.search}%`])
          .orWhereRaw("line->>'description' ILIKE ?", [`%${body.search}%`])
          .orWhereRaw("line->>'item' ILIKE ?", [`%${body.search}%`])
          .orWhereRaw("COALESCE(i.item_id, i2.item_id) ILIKE ?", [`%${body.search}%`]);
      });
    }

    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    let orderByRaw = `(line->>'linesequencenumber')::numeric ${sortOrder}`;
    if (body.sort_by) {
      if (body.sort_by === 'created_at') {
        orderByRaw = `po.created_at ${sortOrder}`;
      } else if (body.sort_by === 'item') {
        orderByRaw = `COALESCE(NULLIF(line->>'item_display', ''), COALESCE(NULLIF(i.item_id, ''), i2.item_id)) ${sortOrder}`;
      } else {
        orderByRaw = `line->>'${body.sort_by}' ${sortOrder}`;
      }
    }

    const items = await query.clone()
      .select([
        dbNetsuite.raw("line->>'line_id' AS line_id"),
        dbNetsuite.raw("line->>'linesequencenumber' AS linesequencenumber"),
        dbNetsuite.raw("line->>'inbound_shipment_number' AS inbound_shipment_number"),
        dbNetsuite.raw("line->>'inbound_shipment_line_id' AS inbound_shipment_line_id"),
        dbNetsuite.raw("line->>'has_inbound' AS has_inbound"),
        dbNetsuite.raw("COALESCE(NULLIF(line->>'item', ''), line->>'itemId') AS item"),
        dbNetsuite.raw("COALESCE(NULLIF(line->>'item_display', ''), COALESCE(NULLIF(i.item_id, ''), i2.item_id)) AS item_display"),
        dbNetsuite.raw("COALESCE(NULLIF(line->>'quantity', ''), line->>'qty') AS quantity"),
        dbNetsuite.raw("line->>'quantityreceived' AS quantityreceived"),
        dbNetsuite.raw("(COALESCE(NULLIF(line->>'quantity', ''), line->>'qty')::numeric - COALESCE(NULLIF(line->>'quantityreceived', ''), '0')::numeric) AS quantitypending"),
        dbNetsuite.raw("line->>'rate' AS rate"),
        dbNetsuite.raw("line->>'netamount' AS netamount"),
        dbNetsuite.raw("line->>'grossamt' AS grossamt"),
        dbNetsuite.raw("line->>'department' AS department"),
        dbNetsuite.raw("d_line.name AS department_display"),
        dbNetsuite.raw("line->>'class' AS class"),
        dbNetsuite.raw("c_line.name AS class_display"),
        dbNetsuite.raw("line->>'location' AS location"),
        dbNetsuite.raw("l_line.name AS location_display"),
        dbNetsuite.raw("line->>'taxcode' AS taxcode"),
        dbNetsuite.raw("t_line.taxcode_name AS taxcode_display"),
        dbNetsuite.raw("line->>'taxrate1' AS taxrate1"),
        dbNetsuite.raw("line->>'tax1amt' AS tax1amt"),
        dbNetsuite.raw("line->>'custcol_me_landed_cost' AS custcol_me_landed_cost"),
        dbNetsuite.raw("line->>'custcol_msi_fob' AS custcol_msi_fob"),
        dbNetsuite.raw("line->>'description' AS description")
      ])
      .orderByRaw(orderByRaw)
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
    throw { message: error.message || 'Failed to fetch items from database', statusCode: error.statusCode || 500 };
  }
};

const saveFileRecord = async (fileData) => {
  const [record] = await pgCore('purchasing_orders_files').insert(fileData).returning('*');
  return record;
};

const updateFileRecord = async (oldPath, newPath, newUrl) => {
  const [record] = await pgCore('purchasing_orders_files')
    .where('storage_path', oldPath)
    .update({
      storage_path: newPath,
      share_url: newUrl
    })
    .returning('*');
  return record;
};

const finalizeUploadedFilesForPO = async (tempPoId, realPoId) => {
  try {
    const nextcloud = require('../../utils/nextcloud');
    const path = require('path');

    // 1. Ambil ke db gate_sso tabel purchasing_orders_files where po_id = po id temporary
    const files = await pgCore('purchasing_orders_files')
      .where('po_id', tempPoId);

    if (!files || files.length === 0) {
      console.info(`[finalizeUploadedFilesForPO] No files found for temporary PO ID: ${tempPoId}`);
      return;
    }

    // Ambil po_number dari db netsuite di tabel purchase_orders kolom po_number
    let folderName = realPoId;
    try {
      const poRecord = await dbNetsuite('purchase_orders')
        .where('po_id', realPoId.toString())
        .first();
      if (poRecord && poRecord.po_number) {
        folderName = poRecord.po_number;
        console.info(`[finalizeUploadedFilesForPO] Found po_number: ${folderName} for po_id: ${realPoId}`);
      } else {
        console.warn(`[finalizeUploadedFilesForPO] No purchase order record or po_number found for po_id: ${realPoId}, falling back to po_id for folder name`);
      }
    } catch (dbErr) {
      console.error(`[finalizeUploadedFilesForPO] Error retrieving po_number from DB Netsuite:`, dbErr.message);
    }

    const year = new Date().getFullYear();
    const finalDir = `/NetSuite/PurchasingOrders/${year}/${folderName}`;

    // 2. Cek juga sebelum membuat folder, apakah sudah ada folder tersebut atau belum
    // ensureDirectoryExists already checks if directory exists, if not it creates it
    await nextcloud.ensureDirectoryExists(finalDir);

    for (const file of files) {
      const oldStoragePath = file.storage_path;
      const fileName = path.basename(oldStoragePath);
      const newStoragePath = `${finalDir}/${fileName}`;

      console.info(`[finalizeUploadedFilesForPO] Moving file from ${oldStoragePath} to ${newStoragePath}`);

      try {
        // Move file in Nextcloud
        await nextcloud.client.moveFile(oldStoragePath, newStoragePath);

        // Generate new share link for the new path so the link doesn't break
        let newShareUrl = file.share_url;
        try {
          newShareUrl = await nextcloud.generateShareLink(newStoragePath);
        } catch (shareErr) {
          console.warn(`[finalizeUploadedFilesForPO] Failed to generate new share link for ${newStoragePath}:`, shareErr.message);
        }

        // Update database: storage_path, share_url, and po_id (to the real NetSuite po_id)
        await pgCore('purchasing_orders_files')
          .where('id', file.id)
          .update({
            po_id: realPoId.toString(),
            storage_path: newStoragePath,
            share_url: newShareUrl
          });

        console.info(`[finalizeUploadedFilesForPO] File record updated successfully for file ID: ${file.id}`);
      } catch (moveErr) {
        console.error(`[finalizeUploadedFilesForPO] Failed to move file ${oldStoragePath}:`, moveErr.message);
      }
    }
  } catch (error) {
    console.error(`[finalizeUploadedFilesForPO] Error finalizing files for PO ${realPoId}:`, error.message);
  }
};

const getFileRecordById = async (id) => {
  const record = await pgCore('purchasing_orders_files')
    .where('id', id)
    .first();
  return record;
};

const deleteFileRecord = async (id) => {
  const count = await pgCore('purchasing_orders_files')
    .where('id', id)
    .delete();
  return count;
};

const updateFileRecordFields = async (id, updateData) => {
  const [record] = await pgCore('purchasing_orders_files')
    .where('id', id)
    .update(updateData)
    .returning('*');
  return record;
};

const getFileRecordByShareUrl = async (shareUrl) => {
  const record = await pgCore('purchasing_orders_files')
    .where('share_url', shareUrl)
    .first();
  return record;
};

const getPurchaseOrderByPoId = async (poId) => {
  const record = await dbNetsuite('purchase_orders')
    .where('po_id', poId.toString())
    .first();
  return record;
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
  syncPurchaseOrdersByIdAll,
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
  retryPurchaseOrder,
  receiveItemPurchaseOrderToBridge,
  updateLocalReceive,
  getReceiveHistoryLogs,
  approvePurchaseOrderToBridge,
  updatePurchaseOrderNotedsStatus,
  getItems,
  saveFileRecord,
  updateFileRecord,
  finalizeUploadedFilesForPO,
  getFileRecordById,
  deleteFileRecord,
  updateFileRecordFields,
  getFileRecordByShareUrl,
  getPurchaseOrderByPoId
};
