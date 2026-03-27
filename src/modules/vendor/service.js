const axios = require('axios');
const authService = require('../auth/service');

const getVendorsList = async (body) => {
  try {
    // 1. Get token from auth module
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch data from bridge API
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/vendors/get`;

    // Map internal payload to bridge API payload format
    const requestData = {
      pageIndex: body.page || 0,
      pageSize: body.limit || 50,
      sort_by: body.sort_by === 'created_at' ? 'last_modified' : (body.sort_by || 'last_modified'),
      sort_order: body.sort_order ? body.sort_order.toUpperCase() : 'DESC',
      filters: body.search ? { search: body.search } : {},
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
        message: error.response.data.message || 'Failed to fetch vendors from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getVendorsList
};
