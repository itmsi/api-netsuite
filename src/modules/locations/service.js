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
 * Format timestamp ke "D/M/YYYY" (e.g. 26/3/2026)
 */
const formatLastModified = (ts) => {
  if (!ts) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

/**
 * Get locations dari DB Netsuite (bridge_sanbox.locations)
 * Format response identik dengan format bridge API sebelumnya.
 */
const getLocationsList = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1) * limit;

    // Kolom yang boleh dijadikan sort_by
    const validSortColumns = [
      'netsuite_id', 'name', 'subsidiary_id', 'subsidiary_name',
      'location_type', 'timezone', 'last_modified_netsuite', 'created_at', 'updated_at'
    ];
    const sortByRaw = body.sort_by === 'created_at' ? 'last_modified_netsuite' : (body.sort_by || 'last_modified_netsuite');
    const orderCol = validSortColumns.includes(sortByRaw) ? sortByRaw : 'last_modified_netsuite';

    let query = dbNetsuite('locations').where('is_deleted', false);

    // Filter opsional
    if (body.search) {
      query = query.whereILike('name', `%${body.search}%`);
    }
    if (body.subsidiary_id) {
      query = query.where('subsidiary_id', String(body.subsidiary_id));
    }
    // is_parent: filter berdasarkan parent_id null/bukan null
    if (body.is_parent === true || body.is_parent === 'true') {
      query = query.whereNull('parent_id');
    } else if (body.is_parent === false || body.is_parent === 'false') {
      query = query.whereNotNull('parent_id');
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
        'is_inactive',
        'parent_id',
        'parent_name',
        'subsidiary_id',
        'subsidiary_name',
        'location_type',
        'location_type_name',
        'timezone',
        'make_inventory_available',
        'last_modified_netsuite'
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    // Format last_modified ke "D/M/YYYY"
    const items = rows.map(row => ({
      ...row,
      last_modified: formatLastModified(row.last_modified_netsuite)
    })).map(({ last_modified_netsuite, ...rest }) => rest);

    return {
      items,
      pagination: { page, limit, total, totalPages }
    };

  } catch (error) {
    throw { message: error.message || 'Failed to fetch locations from database', statusCode: 500 };
  }
};

/**
 * Sync locations — hit bridge API (proses lama), return data langsung.
 */
const syncLocationsList = async (body) => {
  try {
    // 1. Get token
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch dari bridge API
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/locations/get`;

    const filters = {};
    if (body.search) filters.search = body.search;
    filters.is_parent = body.is_parent !== undefined ? body.is_parent : false;
    if (body.subsidiary_id) filters.subsidiary_id = body.subsidiary_id;

    const requestData = {
      page: body.page || 1,
      page_size: body.limit || 10,
      sort_by: body.sort_by === 'created_at' ? 'last_modified_netsuite' : (body.sort_by || 'last_modified_netsuite'),
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
        message: error.response.data.message || 'Failed to sync locations from bridge API',
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
const processLocationsSync = async (records) => {
  if (!records || records.length === 0) return;

  const trx = await db.transaction();
  try {
    for (const record of records) {
      const data = {
        netsuite_id: record.netsuite_id || record.id,
        name: record.name || null,
        is_inactive: record.is_inactive || null,
        parent_id: record.parent_id || null,
        parent_name: record.parent_name || null,
        subsidiary_id: record.subsidiary_id || null,
        subsidiary_name: record.subsidiary_name || null,
        location_type: record.location_type || null,
        location_type_name: record.location_type_name || null,
        timezone: record.timezone || null,
        make_inventory_available: record.make_inventory_available || null,
        data: record.data ? JSON.stringify(record.data) : null,
        last_modified_netsuite: record.last_modified_netsuite ? new Date(record.last_modified_netsuite) : null,
        is_deleted: record.is_deleted || null,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      };

      const existing = await trx('locations').where('netsuite_id', data.netsuite_id.toString()).first();
      if (existing) {
        await trx('locations').where('netsuite_id', data.netsuite_id.toString()).update(data);
      } else {
        data.created_at = db.fn.now();
        await trx('locations').insert(data);
      }
    }
    await trx.commit();
  } catch (error) {
    await trx.rollback();
    console.error('Error syncing locations to gate_sso:', error);
    throw error;
  }
};

module.exports = {
  getLocationsList,
  syncLocationsList,
  processLocationsSync
};
