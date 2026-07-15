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
 * Get departments dari DB Netsuite (bridge_sanbox.departments)
 */
const getDepartmentsList = async (body) => {
  try {
    const page      = parseInt(body.page) || 1;
    const limit     = parseInt(body.limit) || parseInt(body.page_size) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset    = (page - 1) * limit;

    // Kolom yang boleh dijadikan sort_by
    const validSortColumns = [
      'netsuite_id', 'name', 'parent_id', 'parent_name',
      'subsidiary_id', 'subsidiary_name', 'last_modified_netsuite', 'created_at', 'updated_at'
    ];
    const sortByRaw = body.sort_by === 'created_at' ? 'last_modified_netsuite' : (body.sort_by || 'last_modified_netsuite');
    const orderCol  = validSortColumns.includes(sortByRaw) ? sortByRaw : 'last_modified_netsuite';

    let query = dbNetsuite('departments').where('is_delete', false).where('is_inactive', false);

    // Filter opsional
    if (body.search) {
      query = query.whereILike('name', `%${body.search}%`);
    }
    if (body.subsidiary_id) {
      query = query.whereILike('subsidiary_id', `%${body.subsidiary_id}%`);
    }
    if (body.lastmodified) {
      query = query.where('last_modified_netsuite', '>=', body.lastmodified);
    }

    // Hitung total
    const countResult = await query.clone().count('* as total').first();
    const total       = parseInt(countResult.total) || 0;
    const totalPages  = Math.ceil(total / limit);

    // Select kolom sesuai format response
    const items = await query
      .clone()
      .select([
        'netsuite_id as id',
        'name',
        'is_inactive',
        'parent_id',
        'parent_name',
        'subsidiary_id',
        'subsidiary_name',
        'last_modified_netsuite as last_modified'
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      items,
      pagination: { page, limit, total, totalPages }
    };

  } catch (error) {
    throw { message: error.message || 'Failed to fetch departments from database', statusCode: 500 };
  }
};

/**
 * Sync departments — hit bridge API (proses lama), return data langsung.
 */
const syncDepartmentsList = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch data from bridge API
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/department/get`;

    const filters = {};
    if (body.search) {
      filters.search = body.search;
    }
    if (body.subsidiary_id) {
      filters.subsidiary_id = body.subsidiary_id;
    }
    if (body.lastmodified) {
      filters.lastmodified = body.lastmodified;
    }

    // Map internal payload to bridge API payload format
    const requestData = {
      page: body.page || 1,
      page_size: body.limit || body.page_size || 10,
      sort_by: body.sort_by || 'last_modified',
      sort_order: body.sort_order ? body.sort_order.toUpperCase() : 'DESC',
      filters: filters
    };

    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const resData = response.data;

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
        message: error.response.data.message || 'Failed to sync departments from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getDepartmentsList,
  syncDepartmentsList
};
