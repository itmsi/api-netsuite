const axios = require('axios');
const authService = require('../auth/service');
const { dbNetsuite } = require('../../config/database');
const { EXCHANGES, QUEUE } = require('../../utils/constant');
const { publishToRabbitMqQueueSingle } = require('../../config/rabbitmq');

const getCustomerList = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.page_size) || 50;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1) * limit;

    // Mapping sort_by to database column
    const sortMapping = {
      'lastModifiedDate': 'last_modified_netsuite',
      'lastmodified': 'last_modified_netsuite',
      'name': 'name',
      'email': 'email',
      'netsuite_id': 'netsuite_id'
    };
    const orderCol = sortMapping[body.sort_by] || 'last_modified_netsuite';

    let query = dbNetsuite('customers');

    // Apply filters if provided
    if (body.filters) {
      const { filters } = body;

      // internalid (can be array or string/number)
      if (filters.internalid) {
        if (Array.isArray(filters.internalid)) {
          query = query.whereIn('netsuite_id', filters.internalid.map(id => id.toString()));
        } else {
          query = query.where('netsuite_id', filters.internalid.toString());
        }
      }

      // entityid (from jsonb data)
      if (filters.entityid) {
        query = query.whereRaw("data->>'entityId' ILIKE ?", [`%${filters.entityid}%`]);
      }

      // companyname (from name column or jsonb)
      if (filters.companyname) {
        query = query.where('name', 'ILIKE', `%${filters.companyname}%`);
      }

      // email
      if (filters.email) {
        query = query.where('email', 'ILIKE', `%${filters.email}%`);
      }

      // phone
      if (filters.phone) {
        query = query.where('phone', 'ILIKE', `%${filters.phone}%`);
      }

      // lastmodified
      if (filters.lastmodified) {
        query = query.where('last_modified_netsuite', '>=', filters.lastmodified);
      }
    }

    // Get total count for pagination
    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    // Get items with sorting and pagination
    const items = await query
      .select('*')
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
    throw { message: error.message || 'Failed to fetch customers from database', statusCode: 500 };
  }
};

/**
 * Async Customer Creation Process
 */
const createCustomer = async (body, user) => {
  const trx = await dbNetsuite.transaction();
  try {
    // 1. Check if customer already exists (Update if exists)
    let existing;
    if (body.netsuite_id) {
      existing = await trx('customers').where('netsuite_id', body.netsuite_id).first();
    } else if (body.id) {
      existing = await trx('customers').where('id', body.id).first();
    }

    let customerInternalId;
    let eventType = 'CREATE';

    const customerData = {
      name: body.companyname || body.companyName || null,
      email: body.email || null,
      phone: body.phone || null,
      updated_at: new Date()
    };

    if (existing) {
      await trx('customers').where('id', existing.id).update(customerData);
      customerInternalId = existing.id;
      eventType = 'UPDATE';
    } else {
      // Insert new record
      customerData.created_at = new Date();
      // Use timestamp as a temporary unique netsuite_id to satisfy not-null & unique constraints
      customerData.netsuite_id = body.netsuite_id || Math.floor(Date.now() / 1000);

      const [customerInternal] = await trx('customers').insert(customerData).returning('id');
      customerInternalId = typeof customerInternal === 'object' ? customerInternal.id : customerInternal;
    }

    const gate_sso_customer_internal_id = body.internalId || null;

    // 2. Insert ke tabel outbox_events dan tabel outbox_event_logs
    const eventData = {
      event_type: eventType,
      payload: JSON.stringify(body),
      aggregate_id: customerInternalId,
      aggregate_type: 'customer_creation',
      status: 'WAITING',
      retry_count: 0,
      max_retry: 3,
      last_error: null,
      properties: JSON.stringify({
        gate_sso_customer_internal_id: gate_sso_customer_internal_id,
        customer_internal_id: customerInternalId,
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
          message: 'Customer creation queued for processing',
          status: 'WAITING'
        }
      }),
      created_at: new Date(),
      updated_at: new Date()
    });

    await trx.commit();

    // 3. Trigger RabbitMQ queue
    await publishToRabbitMqQueueSingle(
      EXCHANGES.CUSTOMER_CREATE,
      QUEUE.CUSTOMER_CREATE,
      {
        event_id: eventId,
        customer_internal_id: customerInternalId,
        gate_sso_customer_internal_id: gate_sso_customer_internal_id,
        data: body
      },
      {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': `${EXCHANGES.CUSTOMER_CREATE}-retry`
        }
      }
    );

    return {
      id: customerInternalId,
      event_id: eventId,
      message: 'Customer creation process initiated'
    };

  } catch (error) {
    await trx.rollback();
    console.error('[Service] Error in createCustomer:', error.message);
    throw { message: error.message || 'Internal Server Error', statusCode: 500 };
  }
};

/**
 * Helper: Hit Bridge API for customer creation
 */
const createCustomerToBridge = async (body) => {
  const tokenResponse = await authService.getToken();
  const token = tokenResponse.data.access_token;

  const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
  const url = `${baseUrl}/api/v1/bridge/customers/create`;

  const response = await axios.post(url, body, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    timeout: 1500000
  });

  return response.data;
};

/**
 * Helper: Update local customer record after bridge success
 */
const updateLocalCustomer = async (id, bridgeData, gate_sso_customer_internal_id = null) => {
  const netsuiteId = bridgeData.customerId || bridgeData.netsuite_id;

  // 1. Update di db bridge (dbNetsuite)
  // await dbNetsuite('customers')
  //   .where({ id })
  //   .update({
  //     netsuite_id: netsuiteId,
  //     updated_at: new Date()
  //   });

  // 2. Update di db gate_sso (pgCore) jika ada internal id
  if (gate_sso_customer_internal_id) {
    try {
      const { pgCore } = require('../../config/database');
      await pgCore('customers')
        .where('customer_id', gate_sso_customer_internal_id)
        .update({
          customer_id_netsuite: netsuiteId,
          updated_at: new Date()
        });
      console.info(`[Service] Successfully updated gate_sso customer ${gate_sso_customer_internal_id} with NetSuite ID ${netsuiteId}`);
    } catch (ssoErr) {
      console.error(`[Service] Failed to update gate_sso customer ${gate_sso_customer_internal_id}:`, ssoErr.message);
    }
  }
};

/**
 * Helper: Log event to outbox_event_logs
 */
const logEvent = async (eventId, action, message, detail = null) => {
  try {
    await dbNetsuite('outbox_event_logs').insert({
      outbox_event_id: eventId,
      properties: JSON.stringify({
        action,
        message,
        detail
      }),
      created_at: new Date(),
      updated_at: new Date()
    });
  } catch (err) {
    console.error(`[Service] Failed to log event for ${eventId}:`, err.message);
  }
};

/**
 * Helper: Update outbox_event status
 */
const updateEventStatus = async (eventId, status, lastError = null, properties = null) => {
  const updateData = {
    status,
    updated_at: new Date()
  };
  if (lastError) updateData.last_error = lastError;
  if (properties) updateData.properties = JSON.stringify(properties);

  return await dbNetsuite('outbox_events')
    .where({ id: eventId })
    .update(updateData);
};

/**
 * Helper: Check if event can be auto-retried
 */
const canAutoRetry = async (eventId) => {
  const event = await dbNetsuite('outbox_events')
    .where({ id: eventId })
    .select('retry_count', 'max_retry')
    .first();
  return event && event.retry_count < event.max_retry;
};

/**
 * Helper: Increment retry count
 */
const incrementRetryCount = async (eventId, errorMsg) => {
  const [updated] = await dbNetsuite('outbox_events')
    .where({ id: eventId })
    .increment('retry_count', 1)
    .update({
      last_error: errorMsg,
      updated_at: new Date()
    })
    .returning(['retry_count', 'max_retry']);
  return updated;
};

/**
 * Helper: Get event status
 */
const getEventStatus = async (eventId) => {
  const event = await dbNetsuite('outbox_events')
    .where({ id: eventId })
    .select('status')
    .first();
  return event ? event.status : null;
};

/**
 * Helper: Insert into error_logs
 */
const insertErrorLog = async (data) => {
  try {
    await dbNetsuite('error_logs').insert({
      module: 'customer',
      error_message: data.message,
      error_stack: data.stack || null,
      properties: JSON.stringify(data.properties || {}),
      created_at: new Date()
    });
  } catch (err) {
    console.error('[Service] Failed to insert error log:', err.message);
  }
};

module.exports = {
  getCustomerList,
  createCustomer,
  createCustomerToBridge,
  updateLocalCustomer,
  logEvent,
  updateEventStatus,
  canAutoRetry,
  incrementRetryCount,
  getEventStatus,
  insertErrorLog
};
