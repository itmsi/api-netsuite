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
      orderCol = dbNetsuite.raw("COALESCE(NULLIF(po.datecreated, '')::timestamp, po.created_at)");
    } else {
      orderCol = `po.${orderCol}`;
    }

    let query = dbNetsuite('purchase_orders as po');

    // Filter opsional
    if (body.search) {
      query = query.where(function () {
        this.whereILike('po.po_number', `%${body.search}%`)
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

    if (body.po_status) {
      query = query.where('po.po_status', body.po_status);
    }

    if (body.approvalstatus) {
      query = query.where('po.approvalstatus', body.approvalstatus);
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
        dbNetsuite.raw("COALESCE(NULLIF(po.datecreated, '')::timestamp, po.created_at) AS created_at")
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
  const trx = await dbNetsuite.transaction();
  try {
    // 1. create data ke DB netsuite tabel receives (initial state)
    const receiveData = {
      createdfrom: body.purchase_order, // po_id integer
      status: 'pending',
      memo: body.memo || null,
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
const receiveItemPurchaseOrderToBridge = async (body) => {
  const tokenResponse = await authService.getToken();
  const token = tokenResponse.data.access_token;

  const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
  const url = `${baseUrl}/api/v1/bridge/purchase-orders/receive-item`;

  const response = await axios.post(url, body, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
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
        'po.custbody_me_wf_next_approver_blank', 'po.custbody_me_wf_next_approver_blank_display',
        dbNetsuite.raw(`
          jsonb_agg(
            jsonb_build_object(
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
                'description', line->>'description'
            )
          ) FILTER (WHERE line IS NOT NULL) AS lines
        `)
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
  retryPurchaseOrder,
  receiveItemPurchaseOrderToBridge
};
