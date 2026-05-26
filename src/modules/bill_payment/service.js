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
 * Get bill payments dari DB Netsuite (bridge_sanbox.bills_payments)
 */
const getBillPaymentList = async (body) => {
  try {
    const page = body.page !== undefined ? parseInt(body.page) : 1;
    const limit = parseInt(body.page_size) || parseInt(body.limit) || 20;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1 < 0 ? 0 : page - 1) * limit;

    const validSortColumns = [
      'id', 'netsuite_id', 'transactionnumber', 'tranid',
      'entity', 'entity_display', 'account', 'account_display',
      'currency', 'currency_display', 'postingperiod', 'postingperiod_display',
      'approvalstatus', 'approvalstatus_display', 'subsidiary', 'subsidiary_display',
      'class', 'class_display', 'department', 'department_display',
      'location', 'location_display', 'total', 'exchangerate',
      'trandate', 'last_modified_netsuite', 'created_at', 'updated_at'
    ];
    const sortByRaw = body.sort_by || 'trandate';
    const orderCol = validSortColumns.includes(sortByRaw) ? sortByRaw : 'trandate';

    let query = dbNetsuite('bills_payments');

    // Filter opsional
    if (body.filters) {
      if (body.filters.search) {
        query = query.where(function () {
          this.whereILike('tranid', `%${body.filters.search}%`)
            .orWhereILike('transactionnumber', `%${body.filters.search}%`)
            .orWhereILike('entity_display', `%${body.filters.search}%`)
            .orWhereILike('account_display', `%${body.filters.search}%`);
        });
      }
      if (body.filters.is_deleted !== undefined) {
        query = query.where('is_deleted', body.filters.is_deleted);
      }
      if (body.filters.entity) {
        query = query.where('entity', body.filters.entity);
      }
      if (body.filters.currency) {
        query = query.where('currency', body.filters.currency);
      }
      if (body.filters.subsidiary) {
        query = query.where('subsidiary', body.filters.subsidiary);
      }
      if (body.filters.approvalstatus) {
        query = query.where('approvalstatus', body.filters.approvalstatus);
      }
      if (body.filters.department) {
        query = query.where('department', body.filters.department);
      }
      if (body.filters.location) {
        query = query.where('location', body.filters.location);
      }
      if (body.filters.trandate_from) {
        query = query.where('trandate', '>=', body.filters.trandate_from);
      }
      if (body.filters.trandate_to) {
        query = query.where('trandate', '<=', body.filters.trandate_to);
      }
    }

    // Hitung total
    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    // Select semua kolom secara eksplisit (tidak menggunakan SELECT *)
    const rows = await query
      .clone()
      .select([
        'id',
        'netsuite_id',
        'transactionnumber',
        'tranid',
        'entity_display',
        'account_display',
        'currency_display',
        'postingperiod_display',
        'custbody_me_wf_created_by_display',
        'approvalstatus_display',
        'subsidiary_display',
        'class_display',
        'department_display',
        'location_display',
        'custbody_cseg_cn_cfi_display',
        'entity',
        'account',
        'currency',
        'postingperiod',
        'custbody_me_wf_created_by',
        'approvalstatus',
        'subsidiary',
        'class',
        'department',
        'location',
        'custbody_cseg_cn_cfi',
        'total',
        'exchangerate',
        'trandate',
        'last_modified_netsuite',
        'created_at',
        'updated_at',
        'is_deleted'
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    const items = rows.map(r => ({
      id: r.id || null,
      netsuite_id: r.netsuite_id || null,
      transactionnumber: r.transactionnumber || '',
      tranid: r.tranid || '',
      entity_display: r.entity_display || '',
      account_display: r.account_display || '',
      currency_display: r.currency_display || '',
      postingperiod_display: r.postingperiod_display || '',
      custbody_me_wf_created_by_display: r.custbody_me_wf_created_by_display || '',
      approvalstatus_display: r.approvalstatus_display || '',
      subsidiary_display: r.subsidiary_display || '',
      class_display: r.class_display || '',
      department_display: r.department_display || '',
      location_display: r.location_display || '',
      custbody_cseg_cn_cfi_display: r.custbody_cseg_cn_cfi_display || '',
      entity: r.entity || null,
      account: r.account || null,
      currency: r.currency || null,
      postingperiod: r.postingperiod || null,
      custbody_me_wf_created_by: r.custbody_me_wf_created_by || null,
      approvalstatus: r.approvalstatus || null,
      subsidiary: r.subsidiary || null,
      class: r.class || null,
      department: r.department || null,
      location: r.location || null,
      custbody_cseg_cn_cfi: r.custbody_cseg_cn_cfi || null,
      total: r.total !== null && r.total !== undefined ? parseFloat(r.total) : null,
      exchangerate: r.exchangerate !== null && r.exchangerate !== undefined ? parseFloat(r.exchangerate) : null,
      trandate: r.trandate || null,
      last_modified_netsuite: r.last_modified_netsuite || null,
      applied_to: r.applied_to || null,
      credit_applied: r.credit_applied || null,
      workflow_history: r.workflow_history || null,
      user_notes: r.user_notes || null,
      created_at: r.created_at || null,
      updated_at: r.updated_at || null,
      is_deleted: r.is_deleted || false
    }));

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
    throw { message: error.message || 'Failed to fetch bill payments from database', statusCode: 500 };
  }
};

/**
 * Sync bill payments — hit bridge API.
 */
const syncBillPaymentList = async (body) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/bill-payment/get`;

    const requestData = {
      page: body.page || 1,
      page_size: body.page_size || 20,
      sort_by: body.sort_by || 'tran_date',
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
        message: error.response.data.message || 'Failed to sync bill payments from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getBillPaymentList,
  syncBillPaymentList
};
