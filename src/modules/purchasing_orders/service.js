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
 * Get purchase orders dari DB Netsuite (bridge_sanbox.purchase_orders)
 * Format response identik dengan format bridge API sebelumnya.
 */
const getPurchaseOrders = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1) * limit;

    // Kolom yang boleh dijadikan sort_by
    const validSortColumns = [
      'po_id', 'po_number', 'po_date', 'po_status', 'vendor_id', 'vendor_name',
      'subsidiary', 'location', 'class', 'department', 'last_modified',
      'foreigntotal', 'total', 'approvalstatus', 'created_at', 'updated_at'
    ];
    const orderCol = validSortColumns.includes(body.sort_by) ? body.sort_by : 'last_modified';

    let query = dbNetsuite('purchase_orders');

    // Filter opsional
    if (body.search) {
      query = query.where(function () {
        this.whereILike('po_number', `%${body.search}%`)
          .orWhereILike('vendor_name', `%${body.search}%`)
          .orWhereILike('memo', `%${body.search}%`);
      });
    }
    if (body.subsidiary) {
      query = query.where('subsidiary', body.subsidiary);
    }
    if (body.location) {
      query = query.where('location', body.location);
    }

    // Handle classes filter (parent and children)
    let classIds = [];
    if (body.classes) {
      const parentIdStr = body.classes.toString();
      classIds.push(parentIdStr);

      // Step 2 & 3: Cek ke tabel class untuk child yang memiliki parent_id tersebut
      const children = await dbNetsuite('class')
        .select('netsuite_id')
        .where('parent_id', parentIdStr)
        .andWhere('is_delete', false)
        .whereNull('deleted_at');

      // Step 4 & 5: Masukan daftar netsuite_id tersebut
      if (children && children.length > 0) {
        children.forEach(child => {
          if (child.netsuite_id) classIds.push(child.netsuite_id.toString());
        });
      }
    }

    // Hitung total
    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    // Select kolom eksplisit sesuai format response (exclude raw_request, raw_response, id internal)
    const items = await query
      .clone()
      .select([
        'po_id', 'po_number', 'po_date', 'po_status', 'po_status_label',
        'memo', 'vendor_id', 'vendor_name', 'currency_id', 'currency_symbol',
        'foreigntotal', 'total', 'last_modified', 'approvalstatus', 'approvalstatus_display',
        'custbody_me_wf_created_by', 'custbody_me_wf_in_delegation',
        'custbody_me_delegate_approver', 'custbody_msi_createdby_api',
        'custbody_me_pr_date', 'custbody_me_project_location', 'custbody_me_pr_type',
        'custbody_me_saving_type', 'custbody_me_pr_number', 'custbody_me_description',
        'intercotransaction', 'terms', 'terms_display', 'duedate', 'otherrefnum',
        'subsidiary', 'subsidiary_display', 'location', 'location_display',
        'customform', 'customform_display', 'class', 'class_display',
        'nextapprover', 'custbody_me_validity_date', 'department', 'department_display',
        'lines'
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };

  } catch (error) {
    throw { message: error.message || 'Failed to fetch purchase orders from database', statusCode: 500 };
  }
};

/**
 * Sync purchase orders — hit bridge API (proses lama dari get-list),
 * hasilnya di-return langsung tanpa disimpan.
 */
const syncPurchaseOrders = async (body) => {
  try {
    // 1. Get token
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch dari bridge API
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/get-list`;

    const filters = {};
    if (body.search) filters.search = body.search;
    if (body.classes) filters.classes = body.classes;
    if (body.subsidiary) filters.subsidiary = body.subsidiary;
    if (body.location) filters.location = body.location;

    const requestData = {
      page: body.page || 1,
      page_size: body.limit || 10,
      sort_by: body.sort_by || 'last_modified',
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

    // 3. Return dengan format yang sama dengan get-list
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
        message: error.response.data.message || 'Failed to sync purchase orders from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const createPurchaseOrder = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Hit bridge create purchase order endpoint
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/create`;

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
        message: error.response.data.message || 'Failed to create purchase order via bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const approvePurchaseOrder = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Hit bridge approval purchase order endpoint
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/approval`;

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
        message: error.response.data.message || 'Failed to approve purchase order via bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const getPurchaseOrderById = async (id) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Hit bridge purchase orders get-list with po_ids filter
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/get-list`;

    const requestData = {
      page: 1,
      page_size: 20,
      sort_by: 't.trandate',
      sort_order: 'DESC',
      filters: {
        po_ids: [parseInt(id)],
        lastmodified: '2025-03-16T23:59:00+07:00'
      }
    };

    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const resData = response.data;

    return {
      success: true,
      message: '',
      data: resData.data || resData.items || [],
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Failed to fetch purchase order detail from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const updatePurchaseOrder = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Hit bridge update purchase order endpoint
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/update`;

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
        message: error.response.data.message || 'Failed to update purchase order via bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

/**
 * Sync single purchase order by ID dari bridge API
 * Hit: GET {BRIDGE_BASE_URL}/api/v1/bridge/purchase-orders/sync/{id}
 */
const syncPurchaseOrderById = async (id) => {
  try {
    // 1. Get token
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Hit bridge sync by ID endpoint
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/sync/${id}`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Failed to sync purchase order by ID from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getPurchaseOrders,
  syncPurchaseOrders,
  createPurchaseOrder,
  approvePurchaseOrder,
  getPurchaseOrderById,
  updatePurchaseOrder,
  syncPurchaseOrderById
};
