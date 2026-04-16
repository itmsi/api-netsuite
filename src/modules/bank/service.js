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
 * Get banks dari DB Netsuite (bridge_sanbox.banks)
 */
const getBankList = async (body) => {
  try {
    const page = body.page !== undefined ? parseInt(body.page) : 1;
    const limit = parseInt(body.page_size) || parseInt(body.limit) || 20;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1 < 0 ? 0 : page - 1) * limit; // zero based or 1 based page handling based on request

    const validSortColumns = ['netsuite_id', 'id', 'name', 'is_inactive', 'is_inactive', 'created_at', 'updated_at'];
    const sortByRaw = body.sort_by || 'name';
    const orderCol = validSortColumns.includes(sortByRaw) ? sortByRaw : 'name';

    let query = dbNetsuite('banks');

    // Filter opsional
    if (body.filters) {
      if (body.filters.search) {
        query = query.whereILike('name', `%${body.filters.search}%`);
      }
      if (body.filters.is_inactive !== undefined) {
        query = query.where('is_inactive', body.filters.is_inactive);
      }
    }

    // Hitung total
    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    // Select format response
    const rows = await query
      .clone()
      .select([
        'netsuite_id as id',
        'name',
        'is_inactive'
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    // Some tables might have 'id' instead of 'netsuite_id'. If mapping is wrong, 'id' handles fallback
    const items = rows.map(r => ({
      id: r.id ? String(r.id) : null,
      name: r.name || '',
      is_inactive: r.is_inactive || false
    }));

    // If page is 1-based, we'll return 1-based or match the prompt's 0-based page if requested
    // The prompt expects: "page": 0, "limit": 1
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
    throw { message: error.message || 'Failed to fetch banks from database', statusCode: 500 };
  }
};

/**
 * Sync banks — hit bridge API.
 */
const syncBankList = async (body) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/bank/get`;

    const requestData = {
      page: body.page || 1,
      page_size: body.page_size || 20,
      sort_by: body.sort_by || 'name',
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

    return {
      items: resData.data?.items || resData.items || [],
      pagination: resData.data?.pagination || resData.pagination || {
        page: requestData.page,
        limit: requestData.page_size,
        total: 0,
        totalPages: 0
      }
    };

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data.message || 'Failed to sync banks from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getBankList,
  syncBankList
};
