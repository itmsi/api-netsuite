const axios = require('axios');

/**
 * Service Layer - Business Logic
 */

/**
 * Get access token from motorsights API bridge
 */
const getToken = async () => {
  const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
  const url = `${baseUrl}/api/v1/bridge/auth/token`;
  const requestData = {
    grant_type: 'client_credentials',
    client_id: process.env.BRIDGE_CLIENT_ID,
    client_secret: process.env.BRIDGE_CLIENT_SECRET
  };

  try {
    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // The relevant part of response:
    // {
    //   success: true,
    //   data: { access_token: "...", ... },
    //   timestamp: "..."
    // }
    return response.data;
  } catch (error) {
    if (error.response) {
      throw { 
        message: error.response.data.message || 'Failed to fetch token from bridge API', 
        statusCode: error.response.status 
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getToken
};
