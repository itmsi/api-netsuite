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
 * Map raw DB row ke format response yang diinginkan
 */
const mapSalesOrder = (row) => {
  return {
    ...row,
    id: row.id ? row.id.toString() : null,
    customer_id: row.customer_id ? row.customer_id.toString() : '',
    last_modified: row.last_modified_netsuite || row.updated_at || null,
    items: row.items || []
  };
};

/**
 * Get base query for sales orders with all joins and items aggregation
 */
const getBaseQuery = () => {
  return dbNetsuite('sales_orders as so')
    .leftJoin('customers as c', 'c.netsuite_id', 'so.customer_id')
    .leftJoin('subsidiarys as s', 's.subsidiary_id', 'so.subsidiary')
    .leftJoin('currencys as c2', 'c2.currency_id', 'so.currency')
    .leftJoin('departments as d', dbNetsuite.raw('d.netsuite_id::integer = so.department::integer'))
    .leftJoin('class as c3', dbNetsuite.raw('c3.netsuite_id::integer = so.class::integer'))
    .leftJoin('locations as l', dbNetsuite.raw('l.netsuite_id::integer = so.location::integer'))
    // JOIN ITEMS LATERAL
    .leftJoin(dbNetsuite.raw("LATERAL jsonb_array_elements(COALESCE(so.items, '[]'::jsonb)) AS item_row ON TRUE"))
    .leftJoin('items as i', dbNetsuite.raw("(item_row->>'item_id') = i.netsuite_id::text"))
    .leftJoin('class as ic', dbNetsuite.raw("(item_row->>'class') = ic.netsuite_id::text"))
    .leftJoin('locations as il', dbNetsuite.raw("(item_row->>'location') = il.netsuite_id::text"))
    .leftJoin('departments as id_item', dbNetsuite.raw("(item_row->>'department') = id_item.netsuite_id::text"))
    .select([
      'so.id',
      'so.netsuite_id',
      'so.tranid',
      'so.tran_date',
      'so.status_code',
      'so.status_name',
      'so.customer_id',
      dbNetsuite.raw("COALESCE(NULLIF(so.customer_name, ''), c.entity_id) AS customer_name"),
      'so.memo',
      'so.last_modified_netsuite',
      'so.created_at',
      'so.updated_at',
      'so.subsidiary',
      dbNetsuite.raw("COALESCE(NULLIF(so.subsidiary_name, ''), s.subsidiary_name) AS subsidiary_name"),
      'so.otherrefnum',
      'so.currency',
      dbNetsuite.raw("COALESCE(NULLIF(so.currency_name, ''), c2.currency_name) AS currency_name"),
      'so.department',
      dbNetsuite.raw("COALESCE(NULLIF(so.department_name, ''), d.name) AS department_name"),
      'so.class',
      dbNetsuite.raw("COALESCE(NULLIF(so.class_name, ''), c3.name) AS class_name"),
      'so.location',
      dbNetsuite.raw("COALESCE(NULLIF(so.location_name, ''), l.name) AS location_name"),
      'so.custbody_msi_quotation_no_iec',
      'so.custbody_msi_bank_payment_so',
      'so.custbody_cseg_cn_cfi',
      'so.intercotransaction',
      'so.intercotransaction_name',
      'so.intercostatus',
      'so.intercostatus_name',
      'so.datecreated as created_at_netsuite',
      dbNetsuite.raw(`
        jsonb_agg(
          jsonb_build_object(
            'item_id', item_row->>'item_id',
            'item_name', COALESCE(NULLIF(item_row->>'item_name', ''), i.display_name),
            'quantity', item_row->>'quantity',
            'rate', item_row->>'rate',
            'amount', item_row->>'amount',
            'description', item_row->>'description',
            'shipped', item_row->>'shipped',
            'taxcode', item_row->>'taxcode',
            'taxcode_name', item_row->>'taxcode_name',
            'department', item_row->>'department',
            'department_name', COALESCE(NULLIF(item_row->>'department_name', ''), id_item.name),
            'class', item_row->>'class',
            'class_name', COALESCE(NULLIF(item_row->>'class_name', ''), ic.name),
            'location', item_row->>'location',
            'location_name', COALESCE(NULLIF(item_row->>'location_name', ''), il.name)
          )
        ) FILTER (WHERE item_row IS NOT NULL) AS items
      `)
    ])
    .groupBy([
      'so.id', 'c.entity_id', 's.subsidiary_name', 'c2.currency_name', 'd.name', 'c3.name', 'l.name'
    ]);
};

/**
 * Get sales orders dari DB Netsuite (bridge_sanbox.sales_orders)
 */
const getSalesOrders = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || parseInt(body.page_size) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1) * limit;

    const validSortColumns = [
      'netsuite_id', 'tranid', 'tran_date', 'status_code', 'customer_id',
      'customer_name', 'last_modified_netsuite', 'created_at', 'updated_at'
    ];
    const sortBy = validSortColumns.includes(body.sort_by) ? body.sort_by : 'last_modified_netsuite';

    let countQuery = dbNetsuite('sales_orders').where('is_deleted', false);
    let dataQuery = getBaseQuery().where('so.is_deleted', false);

    if (body.search) {
      const searchFn = function () {
        this.whereILike('so.tranid', `%${body.search}%`)
          .orWhereILike('so.customer_name', `%${body.search}%`)
          .orWhereILike('so.memo', `%${body.search}%`);
      };
      countQuery = countQuery.where(searchFn);
      dataQuery = dataQuery.where(searchFn);
    }
    if (body.customer_id) {
      countQuery = countQuery.where('customer_id', body.customer_id.toString());
      dataQuery = dataQuery.where('so.customer_id', body.customer_id.toString());
    }
    if (body.status_code) {
      countQuery = countQuery.where('status_code', body.status_code);
      dataQuery = dataQuery.where('so.status_code', body.status_code);
    }
    if (body.id || body.netsuite_id) {
      const ids = Array.isArray(body.id) ? body.id : (body.id ? [body.id] : (body.netsuite_id || []));
      countQuery = countQuery.whereIn('netsuite_id', ids);
      dataQuery = dataQuery.whereIn('so.netsuite_id', ids);
    }

    const countResult = await countQuery.count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const rows = await dataQuery
      .orderBy(`so.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      items: rows.map(mapSalesOrder),
      pagination: { page, limit, total, totalPages }
    };

  } catch (error) {
    throw { message: error.message || 'Failed to fetch sales orders from database', statusCode: 500 };
  }
};

/**
 * Get single sales order by netsuite_id atau UUID id dari DB lokal
 */
const getSalesOrderById = async (id) => {
  try {
    // 1. Cek berdasarkan netsuite_id dulu
    let row = await getBaseQuery()
      .where('so.netsuite_id', id.toString())
      .where('so.is_deleted', false)
      .first();

    // 2. Jika tidak ketemu, cek berdasarkan UUID (kolom id)
    if (!row) {
      // Regex untuk validasi format UUID (biar tidak error di Postgres jika input sembarang string)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        row = await getBaseQuery()
          .where('so.id', id)
          .where('so.is_deleted', false)
          .first();
      }
    }

    if (!row) {
      throw { message: `Sales order dengan ID '${id}' tidak ditemukan`, statusCode: 404 };
    }

    return {
      items: [mapSalesOrder(row)],
      pagination: { page: 1, limit: 1, total: 1, totalPages: 1 }
    };

  } catch (error) {
    if (error.statusCode) throw error;
    throw { message: error.message || 'Failed to fetch sales order by ID', statusCode: 500 };
  }
};

/**
 * Sync sales orders — hit bridge API POST /sales-orders/get
 */
const syncSalesOrders = async (body) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/sales-orders/get`;

    const filters = {};
    if (body.search) filters.search = body.search;
    if (body.customer_id) filters.customer_id = body.customer_id;
    if (body.status_code) filters.status_code = body.status_code;

    const requestData = {
      page: body.page - 1 || 0,
      page_size: body.limit || body.page_size || 10,
      sort_by: body.sort_by || 'last_modified_netsuite',
      sort_order: body.sort_order ? body.sort_order.toUpperCase() : 'DESC',
      filters: body.filters || filters
    };

    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Failed to sync sales orders from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

/**
 * Create sales order — hit bridge API POST /sales-orders/create
 */
const createSalesOrder = async (body) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/sales-orders/create`;

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
        message: error.response.data?.message || 'Failed to create sales order via bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

/**
 * Update sales order — hit bridge API POST /sales-orders/update
 */
const updateSalesOrder = async (body) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/sales-orders/update`;

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
        message: error.response.data?.message || 'Failed to update sales order via bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getSalesOrders,
  getSalesOrderById,
  syncSalesOrders,
  createSalesOrder,
  updateSalesOrder
};
