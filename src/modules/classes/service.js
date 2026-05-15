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
 * Get classes dari DB Netsuite (bridge_sanbox.class)
 */
const getClassesList = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || parseInt(body.page_size) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1) * limit;

    // Kolom yang boleh dijadikan sort_by
    const validSortColumns = [
      'netsuite_id', 'name', 'parent_id', 'parent_name',
      'subsidiary_id', 'subsidiary_name', 'last_modified_netsuite', 'created_at', 'updated_at'
    ];
    const sortByRaw = body.sort_by === 'created_at' ? 'last_modified_netsuite' : (body.sort_by || 'last_modified_netsuite');
    const orderCol = validSortColumns.includes(sortByRaw) ? sortByRaw : 'last_modified_netsuite';

    let query = dbNetsuite('class').where('is_delete', false);

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

    if (body.class_profile) {
      query = query.where(function () {
        this.where('netsuite_id', body.class_profile.toString())
          .orWhere('parent_id', body.class_profile.toString());
      });
    }

    // Hitung total
    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

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
    throw { message: error.message || 'Failed to fetch classes from database', statusCode: 500 };
  }
};

/**
 * Sync classes — hit bridge API (proses lama), return data langsung.
 */
const syncClassesList = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch data from bridge API
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/class/get`;

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
    if (body.class_profile) {
      filters.class_profile = body.class_profile;
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
        message: error.response.data.message || 'Failed to sync classes from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const { pgCore: db } = require('../../config/database');

/**
 * Memproses sync ke tabel class di gate_sso
 */
const processClassSync = async (records) => {
  if (!records || records.length === 0) return;

  const trx = await db.transaction();
  try {
    for (const record of records) {
      const data = {
        netsuite_id: record.netsuite_id || record.id,
        name: record.name || null,
        is_inactive: record.is_inactive || false,
        parent_id: record.parent_id || null,
        parent_name: record.parent_name || null,
        subsidiary_id: record.subsidiary_id || null,
        subsidiary_name: record.subsidiary_name || null,
        last_modified_netsuite: record.last_modified_netsuite ? new Date(record.last_modified_netsuite) : null,
        updated_at: db.fn.now(),
        data: record.data ? JSON.stringify(record.data) : null,
      };

      // Ensure netsuite_id is treated as string if that's how it's stored, 
      // or parseInt if it's an integer. 
      // Looking at the query in getClassesList, it uses netsuite_id.

      const existing = await trx('class').where('netsuite_id', data.netsuite_id.toString()).first();
      if (existing) {
        await trx('class').where('netsuite_id', data.netsuite_id.toString()).update(data);
      } else {
        data.created_at = db.fn.now();
        await trx('class').insert(data);
      }
    }
    await trx.commit();
  } catch (error) {
    await trx.rollback();
    console.error('Error syncing classes to gate_sso:', error);
    throw error;
  }
};

module.exports = {
  getClassesList,
  syncClassesList,
  processClassSync
};
