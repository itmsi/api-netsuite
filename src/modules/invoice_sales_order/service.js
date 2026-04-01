const axios = require('axios');
const authService = require('../auth/service');

/**
 * Get invoice sales orders from bridge API
 */
const getInvoiceSalesOrders = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch invoice sales orders from bridge API
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/invoice-sales-orders/get`;

    // Map internal payload to bridge API payload format
    const requestData = {
      page: body.page || 1,
      page_size: body.page_size || 20,
      sort_by: body.sort_by || 'trandate',
      sort_order: body.sort_order || 'DESC',
      filters: body.filters || {}
    };

    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data.message || 'Failed to fetch invoice sales orders from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getInvoiceSalesOrders
};
