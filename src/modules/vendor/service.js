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
 * Get vendors dari DB Netsuite (bridge_sanbox.vendors)
 * Format response identik dengan format bridge API sebelumnya.
 */
const getVendorsList = async (body) => {
  try {
    const page = body.page !== undefined ? parseInt(body.page) : 1;
    const limit = parseInt(body.limit) || 50;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1) * limit;

    // Kolom yang boleh dijadikan sort_by
    const validSortColumns = [
      'netsuite_id', 'entity_id', 'company_name', 'name', 'email',
      'subsidiary', 'terms', 'last_modified_netsuite', 'created_at', 'updated_at'
    ];
    const sortByRaw = body.sort_by === 'created_at' ? 'last_modified_netsuite' : (body.sort_by || 'last_modified_netsuite');
    const orderCol = validSortColumns.includes(sortByRaw) ? sortByRaw : 'last_modified_netsuite';

    let query = dbNetsuite('vendors').where('is_deleted', false);

    // Filter opsional
    if (body.search) {
      query = query.where(function () {
        this.whereILike('entity_id', `%${body.search}%`)
          .orWhereILike('company_name', `%${body.search}%`)
          .orWhereILike('name', `%${body.search}%`);
      });
    }
    if (body.subsidiary) {
      query = query.where('subsidiary', String(body.subsidiary));
    }
    if (body.netsuite_id) {
      query = query.where('netsuite_id', String(body.netsuite_id));
    }
    if (body.lastmodified) {
      query = query.where('last_modified_netsuite', '>=', body.lastmodified);
    }

    // Hitung total
    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    // Select dengan alias sesuai format response
    const items = await query
      .clone()
      .select([
        'netsuite_id as internalId',
        'entity_id as entityId',
        'company_name as companyName',
        'email',
        'phone',
        'terms',
        'terms_display',
        'subsidiary',
        'subsidiary_display',
        'last_modified_netsuite as lastModifiedDate',
        'last_modified_raw as lastModifiedDateRaw'
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      items,
      pagination: { page, limit, total, totalPages }
    };

  } catch (error) {
    throw { message: error.message || 'Failed to fetch vendors from database', statusCode: 500 };
  }
};

/**
 * Sync vendors — hit bridge API (proses lama), return data langsung.
 */
const syncVendorsList = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch data from bridge API
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/vendors/get`;

    const requestData = {
      pageIndex: body.page ? (body.page - 1) : 0,
      pageSize: body.limit || 50,
      sort_by: body.sort_by === 'created_at' ? 'last_modified' : (body.sort_by || 'last_modified'),
      sort_order: body.sort_order ? body.sort_order.toUpperCase() : 'DESC',
      search: body.search || '',
      lastmodified: body.lastmodified || null,
      netsuite_id: body.netsuite_id || null,
      subsidiary: body.subsidiary || null
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
        page: resData.page || resData.pageIndex || body.page || 0,
        limit: resData.page_size || resData.pageSize || body.limit || 50,
        total: resData.total_records || resData.totalRows || 0,
        totalPages: resData.total_pages || resData.totalPages || 0
      }
    };

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data.message || 'Failed to sync vendors from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const { pgCore: db } = require('../../config/database');

/**
 * Memproses sync ke tabel vendors di gate_sso
 */
const processVendorsSync = async (records) => {
  if (!records || records.length === 0) return;

  const trx = await db.transaction();
  try {
    for (const record of records) {
      const data = {
        netsuite_id: record.netsuite_id || record.id,
        name: record.name || null,
        email: record.email || null,
        phone: record.phone || null,
        data: record.data ? JSON.stringify(record.data) : null,
        last_modified_netsuite: record.last_modified_netsuite ? new Date(record.last_modified_netsuite) : null,
        last_modified_raw: record.last_modified_raw || null,
        entity_id: record.entity_id || null,
        company_name: record.company_name || null,
        terms: record.terms || null,
        terms_display: record.terms_display || null,
        subsidiary: record.subsidiary || null,
        subsidiary_display: record.subsidiary_display || null,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      };

      const existing = await trx('vendors').where('netsuite_id', data.netsuite_id.toString()).first();
      if (existing) {
        await trx('vendors').where('netsuite_id', data.netsuite_id.toString()).update(data);
      } else {
        data.created_at = db.fn.now();
        await trx('vendors').insert(data);
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
  getVendorsList,
  syncVendorsList,
  processVendorsSync
};
