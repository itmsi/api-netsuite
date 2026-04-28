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
 * Get items dari DB Netsuite (bridge_sanbox.items)
 * Format response identik dengan format bridge API sebelumnya.
 */
const getItemsList = async (body) => {
  try {
    const page      = parseInt(body.page) || 1;
    const limit     = parseInt(body.limit) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset    = (page - 1) * limit;

    // Kolom yang boleh dijadikan sort_by
    const validSortColumns = [
      'netsuite_id', 'item_id', 'display_name',
      'last_modified_netsuite', 'created_at', 'updated_at'
    ];
    const sortByRaw = body.sort_by === 'created_at' ? 'last_modified_netsuite' : (body.sort_by || 'last_modified_netsuite');
    const orderCol  = validSortColumns.includes(sortByRaw) ? sortByRaw : 'last_modified_netsuite';

    let query = dbNetsuite('items').where('is_deleted', false);

    // Filter opsional
    if (body.search) {
      query = query.where(function () {
        this.whereILike('item_id', `%${body.search}%`)
            .orWhereILike('display_name', `%${body.search}%`)
            .orWhere('netsuite_id', body.search);
      });
    }

    // Hitung total
    const countResult = await query.clone().count('* as total').first();
    const total       = parseInt(countResult.total) || 0;
    const totalPages  = Math.ceil(total / limit);

    // Select dengan alias sesuai format response
    const rows = await query
      .clone()
      .select([
        'netsuite_id as internalId',
        'item_id as itemId',
        'display_name as displayName',
        'last_modified_netsuite as lastModifiedDate',
        'data'
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    // Map: ambil locations dari kolom data (JSONB), hapus data dari output
    const items = rows.map(row => ({
      internalId:      row.internalId,
      itemId:          row.itemId,
      displayName:     row.displayName || '',
      lastModifiedDate: row.lastModifiedDate,
      locations:       (row.data && row.data.locations) ? row.data.locations : []
    }));

    return {
      items,
      pagination: { page, limit, total, totalPages }
    };

  } catch (error) {
    throw { message: error.message || 'Failed to fetch items from database', statusCode: 500 };
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
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/items/get`;

    const requestData = {
      pageIndex:  body.page - 1 || 0,
      pageSize:   body.limit   || 10,
      sort_by:    body.sort_by === 'created_at' ? 'last_modified' : (body.sort_by || 'last_modified'),
      sort_order: body.sort_order ? body.sort_order.toUpperCase() : 'DESC',
      search:     body.search || null
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
        page:       resData.page       || resData.pageIndex  || body.page  || 1,
        limit:      resData.page_size  || resData.pageSize   || body.limit || 10,
        total:      resData.total_records || resData.totalRows   || 0,
        totalPages: resData.total_pages   || resData.totalPages  || 0
      }
    };

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data.message || 'Failed to sync items from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getItemsList,
  syncItemsList
};
