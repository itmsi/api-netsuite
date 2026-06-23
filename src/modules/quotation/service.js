const axios = require('axios');
const knex = require('knex');
const authService = require('../auth/service');

const parsePayloadDate = (dateStr) => {
  if (!dateStr) return null;
  const { strToDate } = require('../../utils');
  if (typeof dateStr === 'string' && dateStr.trim() === '') return null;
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    return strToDate(dateStr.trim());
  }
  const dateObj = new Date(dateStr);
  return isNaN(dateObj.getTime()) ? null : dateObj;
};

// Knex instance untuk DB Netsuite
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

const getQuotationById = async (id) => {
  try {
    const selectCols = [
      'id', 'netsuite_id', 'tranid', 'tran_date', 'duedate',
      'entitystatus', 'entitystatus_name', 'probability', 'expectedclosedate',
      'custbody_me_approval_status', 'custbody_me_approval_status_name',
      'custbody_me_wf_created_by', 'custbody_me_wf_created_by_name',
      'salesrep', 'salesrep_name', 'opportunity', 'opportunity_name',
      'forecasttype', 'forecasttype_name', 'partner', 'partner_name',
      'status_code', 'status_name', 'customer_id', 'customer_name',
      'memo', 'approvalstatus', 'otherrefnum', 'department', 'department_name',
      'class_id', 'class_name', 'location', 'location_name',
      'subsidiary', 'subsidiary_name', 'currency', 'currency_name',
      'custbody_msi_bank_payment_so', 'custbody_msi_bank_payment_so_name',
      'custbody_cseg_cn_cfi', 'custbody_cseg_cn_cfi_name',
      'total_amount', 'last_modified_netsuite', 'datecreated', 'items',
      'is_deleted', 'created_at', 'updated_at', 'created_by', 'updated_by'
    ];

    const isNetsuiteId = /^\d+$/.test(String(id));
    let row;

    if (isNetsuiteId) {
      row = await dbNetsuite('quotations')
        .select(selectCols)
        .where('netsuite_id', parseInt(id))
        .where('is_deleted', false)
        .first();
    }

    // 2. Jika tidak ketemu, cek berdasarkan UUID (kolom id)
    if (!row) {
      // Regex untuk validasi format UUID (biar tidak error di Postgres jika input sembarang string)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        row = await dbNetsuite('quotations')
          .select(selectCols)
          .where('id', id)
          .where('is_deleted', false)
          .first();
      }
    }

    if (!row) {
      throw { message: 'Data quotation tidak ditemukan', statusCode: 404 };
    }

    if (row.total_amount !== null && row.total_amount !== undefined) {
      row.total_amount = parseFloat(row.total_amount);
    }

    return row;

  } catch (error) {
    if (error.statusCode) throw error;
    throw { message: error.message || 'Failed to fetch quotation from database', statusCode: 500 };
  }
};

const getQuotationList = async (body) => {
  try {
    const page = body.page !== undefined ? parseInt(body.page) : 1;
    const limit = parseInt(body.page_size) || parseInt(body.limit) || 20;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1 < 0 ? 0 : page - 1) * limit;

    const validSortColumns = [
      'id', 'netsuite_id', 'tranid', 'tran_date', 'customer_name',
      'total_amount', 'status_name', 'approvalstatus', 'created_at', 'updated_at'
    ];
    const sortByRaw = body.sort_by || 'tran_date';
    const orderCol = validSortColumns.includes(sortByRaw) ? `quotations.${sortByRaw}` : 'quotations.tran_date';

    let query = dbNetsuite('quotations');

    if (body.search) {
      query = query.where(function () {
        this.whereILike('quotations.netsuite_id', `%${body.search}%`)
          .orWhereILike('quotations.tranid', `%${body.search}%`)
          .orWhereILike('quotations.customer_name', `%${body.search}%`)
          .orWhereILike('quotations.memo', `%${body.search}%`);
      });
    }
    if (body.is_deleted !== undefined) {
      query = query.where('quotations.is_deleted', body.is_deleted);
    }
    if (body.customer_id) {
      query = query.where('quotations.customer_id', body.customer_id);
    }
    if (body.subsidiary) {
      query = query.where('quotations.subsidiary', body.subsidiary);
    }
    if (body.approvalstatus) {
      query = query.where('quotations.approvalstatus', body.approvalstatus);
    }
    if (body.classes && body.classes !== 'nan' && body.classes !== 'null' && String(body.classes).trim() !== '') {
      query = query.where('quotations.class_id', String(body.classes).trim());
    }
    if (body.tran_date_from) {
      query = query.where('quotations.tran_date', '>=', body.tran_date_from);
    }
    if (body.tran_date_to) {
      query = query.where('quotations.tran_date', '<=', body.tran_date_to);
    }

    const countResult = await query.clone().countDistinct('quotations.id as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const rows = await query
      .clone()
      .select([
        'quotations.id', 'quotations.netsuite_id', 'quotations.tranid', 'quotations.tran_date', 'quotations.duedate',
        'quotations.entitystatus', 'quotations.entitystatus_name', 'quotations.probability', 'quotations.expectedclosedate',
        'quotations.custbody_me_approval_status', 'quotations.custbody_me_approval_status_name',
        'quotations.custbody_me_wf_created_by', 'quotations.custbody_me_wf_created_by_name',
        'quotations.salesrep', 'quotations.salesrep_name', 'quotations.opportunity', 'quotations.opportunity_name',
        'quotations.forecasttype', 'quotations.forecasttype_name', 'quotations.partner', 'quotations.partner_name',
        'quotations.status_code', 'quotations.status_name', 'quotations.customer_id', 'quotations.customer_name',
        'quotations.memo', 'quotations.approvalstatus', 'quotations.otherrefnum', 'quotations.department', 'quotations.department_name',
        'quotations.class_id', 'quotations.class_name', 'quotations.location', 'quotations.location_name',
        'quotations.subsidiary', 'quotations.subsidiary_name', 'quotations.currency', 'quotations.currency_name',
        'quotations.custbody_msi_bank_payment_so', 'quotations.custbody_msi_bank_payment_so_name',
        'quotations.custbody_cseg_cn_cfi', 'quotations.custbody_cseg_cn_cfi_name',
        'quotations.total_amount', 'quotations.last_modified_netsuite', 'quotations.datecreated',
        'quotations.is_deleted', 'quotations.created_at', 'quotations.updated_at', 'quotations.created_by', 'quotations.updated_by'
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    const items = rows.map(r => ({
      ...r,
      total_amount: r.total_amount !== null && r.total_amount !== undefined ? parseFloat(r.total_amount) : null
    }));

    const resPage = page === 1 && offset === 0 && body.page === 1 ? body.page : 0;

    return {
      items,
      pagination: {
        page: resPage || page,
        limit,
        total,
        totalPages
      }
    };

  } catch (error) {
    throw { message: error.message || 'Failed to fetch quotations from database', statusCode: 500 };
  }
};

const syncQuotationById = async (netsuite_id) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl = process.env.BRIDGE_BASE_URL || 'http://localhost:9570';
    const url = `${baseUrl}/api/v1/bridge/quotations/sync/${netsuite_id}`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data?.data || response.data;

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data?.message || `Failed to sync quotation netsuite_id ${netsuite_id} from bridge API`,
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const createQuotation = async (body, user, userId) => {
  const trx = await dbNetsuite.transaction();
  try {
    const quotationData = {
      tranid: null,
      tran_date: parsePayloadDate(body.tran_date || body.trandate),
      duedate: parsePayloadDate(body.duedate),
      probability: body.probability,
      expectedclosedate: parsePayloadDate(body.expectedclosedate),
      custbody_me_approval_status: body.custbody_me_approval_status,
      salesrep: body.salesrep,
      opportunity: body.opportunity,
      forecasttype: body.forecasttype,
      partner: body.partner,
      otherrefnum: body.otherrefnum,
      custbody_msi_bank_payment_so: body.custbody_msi_bank_payment_so ? JSON.stringify(body.custbody_msi_bank_payment_so) : null,
      custbody_cseg_cn_cfi: body.custbody_cseg_cn_cfi,
      items: body.items ? JSON.stringify(body.items) : null,
      status_name: 'pending',
      memo: body.memo,
      customer_id: body.customer_id || body.entity,
      subsidiary: body.subsidiary,
      location: body.location,
      department: body.department,
      currency: body.currency,
      class_id: body.class_id || body.class,
      created_by: userId,
      created_at: new Date()
    };

    const [qInternal] = await trx('quotations').insert(quotationData).returning('id');
    const qInternalId = typeof qInternal === 'object' ? qInternal.id : qInternal;

    const eventData = {
      event_type: 'CREATE',
      payload: JSON.stringify(body),
      aggregate_id: qInternalId,
      aggregate_type: 'quotation_create',
      status: 'WAITING',
      retry_count: 0,
      max_retry: 3,
      last_error: null,
      properties: JSON.stringify({ request: body }),
      created_at: quotationData.created_at,
      updated_at: quotationData.created_at
    };

    const [eventIdObj] = await trx('outbox_events').insert(eventData).returning('id');
    const eventId = typeof eventIdObj === 'object' ? eventIdObj.id : eventIdObj;

    await trx('outbox_event_logs').insert({
      outbox_event_id: eventId,
      properties: JSON.stringify({ response: { message: 'Quotation queued for processing', status: 'WAITING' } }),
      created_at: quotationData.created_at,
      updated_at: quotationData.created_at
    });

    await trx.commit();

    const { publishToRabbitMqQueueSingle } = require('../../config/rabbitmq');
    const { EXCHANGES, QUEUE } = require('../../utils/constant');

    await publishToRabbitMqQueueSingle(
      EXCHANGES.QUOTATION_CREATE,
      QUEUE.QUOTATION_CREATE,
      { event_id: eventId, quotation_internal_id: qInternalId, data: body },
      { durable: true, arguments: { 'x-dead-letter-exchange': `${EXCHANGES.QUOTATION_CREATE}-retry` } }
    );

    return { success: true, message: 'Quotation is being processed', data: { quotationId: qInternalId, event_id: eventId } };
  } catch (error) {
    if (trx) await trx.rollback();
    throw { message: error.message || 'Failed to initiate quotation creation', statusCode: 500 };
  }
};

const updateQuotation = async (body, user, userId) => {
  const trx = await dbNetsuite.transaction();
  try {
    const { id } = body;

    const isNetsuiteId = /^\d+$/.test(String(id));
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    let record;
    if (isNetsuiteId) {
      record = await trx('quotations').where('netsuite_id', parseInt(id)).first();
    } else if (isUuid) {
      record = await trx('quotations').where('id', id).first();
    }

    if (!record) {
      throw { message: `Quotation dengan ID ${id} tidak ditemukan secara lokal`, statusCode: 404 };
    }

    const localId = record.id;
    const netsuiteId = record.netsuite_id;
    const is_update = record.netsuite_id ? true : false;

    // 1. Update data di DB lokal dulu
    const updateData = {
      tran_date: parsePayloadDate(body.tran_date || body.trandate),
      duedate: parsePayloadDate(body.duedate),
      probability: body.probability,
      expectedclosedate: parsePayloadDate(body.expectedclosedate),
      custbody_me_approval_status: body.custbody_me_approval_status,
      salesrep: body.salesrep,
      opportunity: body.opportunity,
      forecasttype: body.forecasttype,
      partner: body.partner,
      otherrefnum: body.otherrefnum,
      custbody_msi_bank_payment_so: body.custbody_msi_bank_payment_so ? JSON.stringify(body.custbody_msi_bank_payment_so) : undefined,
      custbody_cseg_cn_cfi: body.custbody_cseg_cn_cfi,
      memo: body.memo,
      customer_id: body.customer_id || body.entity,
      subsidiary: body.subsidiary,
      location: body.location,
      department: body.department,
      currency: body.currency,
      class_id: body.class_id || body.class,
      items: body.items ? JSON.stringify(body.items) : undefined,
      updated_at: new Date(),
      updated_by: userId
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    await trx('quotations').where('id', localId).update(updateData);

    // 2. Insert data ke tabel outbox_events dan outbox_event_logs
    const eventData = {
      event_type: is_update ? 'UPDATE' : 'CREATE',
      payload: JSON.stringify(body),
      aggregate_id: localId,
      aggregate_type: is_update ? 'quotation_update' : 'quotation_create',
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
          message: is_update ? 'Update queued for processing' : 'Create queued for processing',
          status: 'WAITING'
        }
      }),
      created_at: new Date(),
      updated_at: new Date()
    });

    await trx.commit();

    const { publishToRabbitMqQueueSingle } = require('../../config/rabbitmq');
    const { EXCHANGES, QUEUE } = require('../../utils/constant');

    if (is_update) {
      // Ganti body.id dengan netsuiteId sebelum dikirim ke queue update
      const bodyWithNetsuiteId = { ...body, id: netsuiteId };

      await publishToRabbitMqQueueSingle(
        EXCHANGES.QUOTATION_UPDATE,
        QUEUE.QUOTATION_UPDATE,
        {
          event_id: eventId,
          quotation_internal_id: localId,
          data: bodyWithNetsuiteId
        },
        {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': `${EXCHANGES.QUOTATION_UPDATE}-retry`
          }
        }
      );
    } else {
      // Hilangkan payload id sebelum dikirim ke queue create
      const { id: _removedId, ...bodyWithoutId } = body;

      await publishToRabbitMqQueueSingle(
        EXCHANGES.QUOTATION_CREATE,
        QUEUE.QUOTATION_CREATE,
        {
          event_id: eventId,
          quotation_internal_id: localId,
          data: bodyWithoutId
        },
        {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': `${EXCHANGES.QUOTATION_CREATE}-retry`
          }
        }
      );
    }

    return {
      success: true,
      message: is_update ? 'Quotation update is being processed' : 'Quotation create is being processed',
      data: {
        quotationId: localId,
        event_id: eventId
      }
    };
  } catch (error) {
    if (trx) await trx.rollback();
    throw {
      message: error.message || 'Failed to initiate quotation update',
      statusCode: error.statusCode || 500,
      errors: error.errors || error
    };
  }
};

const createQuotationToBridge = async (body) => {
  const tokenResponse = await authService.getToken();
  const token = tokenResponse.data.access_token;
  const baseUrl = process.env.BRIDGE_BASE_URL || 'http://localhost:9570';
  const url = `${baseUrl}/api/v1/bridge/quotations/create`;

  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    timeout: 1500000
  });

  const result = response.data;
  if (result && (result.status === 'error' || result.data?.status === 'error')) {
    result.success = false;
  }
  return result;
};

const updateQuotationToBridge = async (body) => {
  const tokenResponse = await authService.getToken();
  const token = tokenResponse.data.access_token;
  const baseUrl = process.env.BRIDGE_BASE_URL || 'http://localhost:9570';
  const url = `${baseUrl}/api/v1/bridge/quotations/update`;

  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    timeout: 1500000
  });

  const result = response.data;
  if (result && (result.status === 'error' || result.data?.status === 'error')) {
    result.success = false;
  }
  return result;
};

const updateLocalQuotationId = async (id, netsuiteId) => {
  await dbNetsuite('quotations').where('netsuite_id', netsuiteId).whereNot('id', id).del();
  await dbNetsuite('quotations').where('id', id).update({
    netsuite_id: netsuiteId,
    updated_at: new Date()
  });
};

const updateLocalQuotationStatus = async (id, status) => {
  await dbNetsuite('quotations').where('id', id).update({
    status_name: status,
    updated_at: new Date()
  });
};

const updateEventStatus = async (id, status, result, properties) => {
  const updateData = { status, updated_at: new Date() };
  const finalProperties = properties || result;
  if (finalProperties) {
    updateData.properties = typeof finalProperties === 'string' ? JSON.stringify({ message: finalProperties }) : JSON.stringify(finalProperties);
  }
  await dbNetsuite('outbox_events').where('id', id).update(updateData);
  if (result) {
    await dbNetsuite('outbox_event_logs').insert({
      outbox_event_id: id,
      properties: JSON.stringify({ response: result }),
      created_at: new Date(), updated_at: new Date()
    });
  }
};

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

const canAutoRetry = async (id) => {
  const event = await dbNetsuite('outbox_events')
    .where('id', id)
    .select('retry_count', 'max_retry')
    .first();
  if (!event) return false;
  return event.retry_count < event.max_retry;
};

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

module.exports = {
  getQuotationById,
  getQuotationList,
  syncQuotationById,
  createQuotation,
  updateQuotation,
  createQuotationToBridge,
  updateQuotationToBridge,
  updateLocalQuotationId,
  updateLocalQuotationStatus,
  updateEventStatus,
  incrementRetryCount,
  canAutoRetry,
  getEventStatus,
  logEvent
};
