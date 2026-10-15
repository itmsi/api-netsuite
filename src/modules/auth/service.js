const axios = require('axios');

/**
 * Service Layer - Business Logic
 */

const getBaseUrl = () => process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
const getTokenUrl = () => `${getBaseUrl()}/api/v1/bridge/auth/token`;

// Cache token di memori agar tiap request ke bridge tidak perlu minta token baru.
// TTL dibatasi (maks TOKEN_CACHE_MAX_MS) supaya token yang di-revoke cepat tergantikan,
// dan dikurangi TOKEN_EXPIRY_MARGIN_MS agar tidak terpakai saat hampir kedaluwarsa.
const TOKEN_CACHE_MAX_MS = 10 * 60 * 1000;
const TOKEN_EXPIRY_MARGIN_MS = 60 * 1000;

let cachedToken = null;
let cachedUntil = 0;
let inflightRequest = null;

const clearTokenCache = () => {
  cachedToken = null;
  cachedUntil = 0;
};

/**
 * Ambil token baru dari motorsights API bridge (tanpa cache), lalu simpan ke cache
 */
const fetchToken = async () => {
  const requestData = {
    grant_type: 'client_credentials',
    client_id: process.env.BRIDGE_CLIENT_ID,
    client_secret: process.env.BRIDGE_CLIENT_SECRET
  };

  try {
    const response = await axios.post(getTokenUrl(), requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // The relevant part of response:
    // {
    //   success: true,
    //   data: { access_token: "...", expires_in: 86400, ... },
    //   timestamp: "..."
    // }
    const result = response.data;
    const expiresInMs = (parseInt(result?.data?.expires_in, 10) || 0) * 1000;
    if (result?.data?.access_token && expiresInMs > TOKEN_EXPIRY_MARGIN_MS) {
      cachedToken = result;
      cachedUntil = Date.now() + Math.min(expiresInMs - TOKEN_EXPIRY_MARGIN_MS, TOKEN_CACHE_MAX_MS);
    }
    return result;
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

/**
 * Get access token from motorsights API bridge (pakai cache bila masih berlaku)
 */
const getToken = async () => {
  if (cachedToken && Date.now() < cachedUntil) return cachedToken;

  // Request paralel saat cache kosong cukup memicu satu request token
  if (!inflightRequest) {
    inflightRequest = fetchToken().finally(() => {
      inflightRequest = null;
    });
  }
  return inflightRequest;
};

// Jika bridge membalas 401 (token di-revoke / tidak valid), buang cache lalu ulangi sekali dengan token baru
axios.interceptors.response.use(undefined, async (error) => {
  const config = error.config;
  const isBridgeRequest =
    config && typeof config.url === 'string' && config.url.startsWith(getBaseUrl()) && config.url !== getTokenUrl();
  const hasBearer = config?.headers?.Authorization && String(config.headers.Authorization).startsWith('Bearer ');

  if (error.response?.status !== 401 || !isBridgeRequest || !hasBearer || config._tokenRetried) {
    throw error;
  }

  clearTokenCache();
  let tokenResponse;
  try {
    tokenResponse = await fetchToken();
  } catch (tokenError) {
    throw error;
  }
  config._tokenRetried = true;
  config.headers.Authorization = `Bearer ${tokenResponse.data.access_token}`;
  return axios.request(config);
});

module.exports = {
  getToken,
  fetchToken,
  clearTokenCache
};
