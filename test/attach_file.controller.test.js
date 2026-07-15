const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const controllerPath = path.join(__dirname, '../src/modules/attach_file/controller');
const servicePath = path.join(__dirname, '../src/modules/attach_file/service');
const nextcloudPath = path.join(__dirname, '../src/utils/nextcloud');

const axios = require('axios');
axios.get = async () => ({ data: {} });

let capturedUpdateData = null;
let deletedPaths = [];
const serviceStub = {
  getFileRecordByNetsuiteFileId: async () => ({
    id: 77,
    netsuite_file_id: 'net-123',
    storage_path: null,
    share_url: null,
    file_name: 'old-file.pdf',
    transaction_type: 'purchase_order',
    netsuite_id: '43379'
  }),
  updateFileRecord: async (_id, updateData) => {
    capturedUpdateData = updateData;
    return updateData;
  },
  callBridgeUpdate: async () => ({ success: true }),
  callBridgeDelete: async () => ({ success: true }),
  getPurchaseOrderByPoId: async () => ({ po_number: 'PO-001' }),
  deleteFileRecord: async () => ({ success: true })
};

const nextcloudStub = {
  NEXTCLOUD_UPLOAD_DIR: '/uploads',
  ensureDirectoryExists: async () => {},
  client: {
    exists: async (filePath) => {
      if (filePath == null) {
        throw new TypeError('The "path" argument must be of type string. Received null');
      }
      return true;
    },
    deleteFile: async (filePath) => {
      deletedPaths.push(filePath);
    },
    moveFile: async () => {}
  },
  generateShareLink: async (filePath) => `https://share.local/${filePath}`
};

require.cache[require.resolve(servicePath)] = {
  id: servicePath,
  filename: servicePath,
  loaded: true,
  exports: serviceStub
};

require.cache[require.resolve(nextcloudPath)] = {
  id: nextcloudPath,
  filename: nextcloudPath,
  loaded: true,
  exports: nextcloudStub
};

delete require.cache[controllerPath];
const controller = require(controllerPath);

test('destroy skips Nextcloud deletion when no storage path exists locally', async () => {
  deletedPaths = [];
  const req = {
    params: { id: 'net-123' },
    body: {},
    user: { employee_id: 'emp-1' },
    headers: { authorization: 'Bearer token' }
  };

  const res = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };

  await controller.destroy(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(deletedPaths.length, 0);
});

test('update handles a missing storage path when only a fileUrl is provided', async () => {
  const req = {
    params: { id: 'net-123' },
    body: {
      fileUrl: 'https://cloud.example.com/file.pdf',
      file_name: 'renamed.pdf',
      netsuite_id: '43379',
      type: 'purchase_order',
      created_by_api: 'api@example.com'
    },
    user: { employee_id: 'emp-1' },
    headers: { authorization: 'Bearer token' },
    file: null
  };

  const res = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };

  await controller.update(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(res.payload.data.fileUrl, 'https://cloud.example.com/file.pdf');
  assert.equal(capturedUpdateData?.file_url, 'https://cloud.example.com/file.pdf');
  assert.equal(capturedUpdateData?.share_url, 'https://cloud.example.com/file.pdf');
});
