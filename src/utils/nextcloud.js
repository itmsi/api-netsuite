const { createClient } = require('webdav');
const axios = require('axios');

const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL || 'https://cloud.inlinegroupdc.com';
const NEXTCLOUD_USERNAME = process.env.NEXTCLOUD_USERNAME || 'falaq';
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_PASSWORD || 'falaq!@#';
const NEXTCLOUD_WEBDAV_PATH = process.env.NEXTCLOUD_WEBDAV_PATH || '/remote.php/webdav';
const NEXTCLOUD_SHARE_API_PATH = process.env.NEXTCLOUD_SHARE_API_PATH || '/ocs/v1.php/apps/files_sharing/api/v1/shares';
const NEXTCLOUD_UPLOAD_DIR = process.env.NEXTCLOUD_UPLOAD_DIR || '/temp';

const client = createClient(
  `${NEXTCLOUD_URL}${NEXTCLOUD_WEBDAV_PATH}`,
  {
    username: NEXTCLOUD_USERNAME,
    password: NEXTCLOUD_PASSWORD
  }
);

/**
 * Ensures a directory exists in Nextcloud
 * @param {string} dirPath Directory path
 */
const ensureDirectoryExists = async (dirPath) => {
  const parts = dirPath.split('/').filter(Boolean);
  let currentPath = '';

  for (const part of parts) {
    currentPath += `/${part}`;
    const exists = await client.exists(currentPath);
    if (!exists) {
      await client.createDirectory(currentPath);
    }
  }
};

/**
 * Generate a public share link using Nextcloud OCS API
 * @param {string} path Path to the file in Nextcloud
 * @returns {string} Public share URL
 */
const generateShareLink = async (path) => {
  try {
    const response = await axios.post(
      `${NEXTCLOUD_URL}${NEXTCLOUD_SHARE_API_PATH}`,
      {
        path: path,
        shareType: 3, // 3 = public link
        permissions: 1 // 1 = read only
      },
      {
        headers: {
          'OCS-APIRequest': 'true',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        auth: {
          username: NEXTCLOUD_USERNAME,
          password: NEXTCLOUD_PASSWORD
        }
      }
    );

    if (response.data && response.data.ocs && response.data.ocs.data) {
      return response.data.ocs.data.url;
    }
    throw new Error('Failed to parse share URL from response');
  } catch (error) {
    console.error('Error generating share link:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  client,
  ensureDirectoryExists,
  generateShareLink,
  NEXTCLOUD_UPLOAD_DIR
};
