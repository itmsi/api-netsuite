const axios = require('axios');
const authService = require('../auth/service');

const getCustomerList = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch data from bridge API
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/customers/get`;

    // Map internal payload to bridge API payload format (following user curl request)
    const requestData = {
      pageSize: body.pageSize || 50,
      pageIndex: body.pageIndex || 0,
      lastmodified: body.lastmodified || null,
      netsuite_id: body.netsuite_id || null
    };

    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const resData = response.data;

    // 3. Map to system template formatting for pagination
    // It seems bridge's response structure usually has items under `data` or `items`
    return {
      items: resData.data || resData.items || [],
      pagination: {
        page: (resData.pageIndex !== undefined ? resData.pageIndex : (resData.page || 0)),
        limit: (resData.pageSize !== undefined ? resData.pageSize : (resData.page_size || 50)),
        total: resData.total_records || resData.totalRows || 0,
        totalPages: resData.total_pages || resData.totalPages || 0
      }
    };

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data.message || 'Failed to fetch customers from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getCustomerList
};
