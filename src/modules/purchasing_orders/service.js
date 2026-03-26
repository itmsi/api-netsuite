const axios = require('axios');
const authService = require('../auth/service');

const getPurchaseOrders = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch purchase orders from bridge API
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/purchase-orders/get-list`;
    
    // Map internal payload to bridge API payload format
    const requestData = {
      page: body.page || 1,
      page_size: body.limit || 10,
      sort_by: body.sort_by === 'created_at' ? 'last_modified' : (body.sort_by || 'last_modified'),
      sort_order: body.sort_order ? body.sort_order.toUpperCase() : 'DESC',
      filters: body.search ? { search: body.search } : {}
    };

    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const resData = response.data;

    // 3. Map to system template formatting for pagination
    return {
      items: resData.data || [],
      pagination: {
        page: resData.page,
        limit: resData.page_size,
        total: resData.total_records,
        totalPages: resData.total_pages
      }
    };

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data.message || 'Failed to fetch purchase orders from bridge API',
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

module.exports = {
  getPurchaseOrders,
  createPurchaseOrder
};
