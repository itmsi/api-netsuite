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
 * Get terms dari DB Netsuite (bridge_sanbox.terms)
 */
const getTermsList = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || parseInt(body.page_size) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1) * limit;

    // Kolom yang boleh dijadikan sort_by
    const validSortColumns = [
      'netsuite_id', 'name', 'isinactive', 'created_at', 'updated_at'
    ];
    const sortByRaw = body.sort_by || 'name';
    const orderCol = validSortColumns.includes(sortByRaw) ? sortByRaw : 'name';

    let query = dbNetsuite('terms').where('is_delete', false);

    // Filter opsional
    if (body.search) {
      query = query.whereILike('name', `%${body.search}%`);
    }

    // Hitung total
    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    // Select kolom sesuai format response
    const rows = await query
      .clone()
      .select([
        'netsuite_id as id',
        'name',
        'isinactive'
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    // Casting id to string sesuai ekspektasi
    const items = rows.map(row => ({
      ...row,
      id: row.id !== null && row.id !== undefined ? String(row.id) : null
    }));

    return {
      items,
      pagination: { page, limit, total, totalPages }
    };

  } catch (error) {
    throw { message: error.message || 'Failed to fetch terms from database', statusCode: 500 };
  }
};

/**
 * Sync terms — hit bridge API (proses lama), return data langsung.
 */
const syncTermsList = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch data from bridge API
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/term/get`;

    const filters = {};
    if (body.search) {
      filters.search = body.search;
    }
    if (body.lastmodified) {
      filters.lastmodified = body.lastmodified;
    }

    // Map internal payload to bridge API payload format
    const requestData = {
      page: body.page || 1,
      page_size: body.limit || body.page_size || 10,
      sort_by: body.sort_by || 'name',
      sort_order: body.sort_order ? body.sort_order.toUpperCase() : 'DESC',
      search: body.search || ''
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
        message: error.response.data.message || 'Failed to sync terms from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const { pgCore: db } = require('../../config/database');

/**
 * Memproses sync ke tabel terms di gate_sso
 */
const processTermsSync = async (records) => {
  if (!records || records.length === 0) return;

  const trx = await db.transaction();
  try {
    for (const record of records) {
      const data = {
        netsuite_id: record.netsuite_id || record.id,
        name: record.name || null,
        isinactive: record.isinactive || null,
        data: record.data ? JSON.stringify(record.data) : null,
        last_modified_netsuite: record.last_modified_netsuite ? new Date(record.last_modified_netsuite) : null,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      };

      const existing = await trx('terms').where('netsuite_id', data.netsuite_id.toString()).first();
      if (existing) {
        await trx('terms').where('netsuite_id', data.netsuite_id.toString()).update(data);
      } else {
        data.created_at = db.fn.now();
        await trx('terms').insert(data);
      }
    }
    await trx.commit();
  } catch (error) {
    await trx.rollback();
    console.error('Error syncing vendors to gate_sso:', error);
    throw error;
  }
};

module.exports = {
  getTermsList,
  syncTermsList,
  processTermsSync
};
