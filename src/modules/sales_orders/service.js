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
 * Kolom items diambil dari kolom jsonb 'data'
 */
const mapSalesOrder = (row) => {
  // Extract items dari kolom data (jsonb) jika ada
  let items = [];
  if (row.data) {
    const rawData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    // data bisa berupa array items langsung, atau objek dengan property items/lines
    if (Array.isArray(rawData)) {
      items = rawData;
    } else if (rawData.items) {
      items = rawData.items;
    } else if (rawData.lines) {
      items = rawData.lines;
    }
  }

  return {
    id: row.netsuite_id ? row.netsuite_id.toString() : null,
    tranid: row.tranid || '',
    tran_date: row.tran_date || null,
    status_code: row.status_code || '',
    status_name: row.status_name || '',
    customer_id: row.customer_id ? row.customer_id.toString() : '',
    customer_name: row.customer_name || '',
    memo: row.memo || null,
    last_modified: row.last_modified_netsuite || row.updated_at || null,
    items
  };
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
    const orderCol = validSortColumns.includes(body.sort_by) ? body.sort_by : 'last_modified_netsuite';

    let query = dbNetsuite('sales_orders').where('is_deleted', false);

    if (body.search) {
      query = query.where(function () {
        this.whereILike('tranid', `%${body.search}%`)
          .orWhereILike('customer_name', `%${body.search}%`)
          .orWhereILike('memo', `%${body.search}%`);
      });
    }
    if (body.customer_id) {
      query = query.where('customer_id', body.customer_id.toString());
    }
    if (body.status_code) {
      query = query.where('status_code', body.status_code);
    }

    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const rows = await query
      .clone()
      .select([
        'netsuite_id', 'tranid', 'tran_date', 'status_code', 'status_name',
        'customer_id', 'customer_name', 'memo', 'last_modified_netsuite',
        'updated_at', 'data'
      ])
      .orderBy(orderCol, sortOrder)
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
 * Get single sales order by netsuite_id dari DB lokal
 */
const getSalesOrderById = async (id) => {
  try {
    const row = await dbNetsuite('sales_orders')
      .where('netsuite_id', id.toString())
      .where('is_deleted', false)
      .select([
        'netsuite_id', 'tranid', 'tran_date', 'status_code', 'status_name',
        'customer_id', 'customer_name', 'memo', 'last_modified_netsuite',
        'updated_at', 'data'
      ])
      .first();

    if (!row) {
      throw { message: `Sales order dengan ID ${id} tidak ditemukan`, statusCode: 404 };
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
      page: body.page || 1,
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
