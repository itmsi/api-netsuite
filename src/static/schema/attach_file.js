const attachFileSchema = {
  AttachFile: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      netsuite_file_id: { type: 'string' },
      netsuite_id: { type: 'string' },
      file_name: { type: 'string' },
      file_url: { type: 'string' },
      created_by_api: { type: 'string' },
      is_delete: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      deleted_at: { type: 'string', format: 'date-time' },
      created_by: { type: 'string' },
      updated_b: { type: 'string' },
      deleted_by: { type: 'string' },
      storage_provider: { type: 'string' },
      storage_path: { type: 'string' },
      share_url: { type: 'string' }
    }
  },
  AttachFileResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/AttachFile' }
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 100 },
              totalPages: { type: 'integer', example: 10 }
            }
          }
        }
      },
      message: { type: 'string', example: 'Data berhasil diambil' }
    }
  },
  AttachFileUploadResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      id: { type: 'integer', example: 1 },
      netsuiteId: { type: 'string', example: '12345' },
      fileUrl: { type: 'string', example: 'https://nextcloud.example.com/s/xyz' },
      storagePath: { type: 'string', example: '/NetSuite/PurchasingOrders/2026/12345/file.pdf' },
      fileName: { type: 'string', example: 'file.pdf' }
    }
  },
  AttachFileDeleteResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'File deleted successfully' }
    }
  }
};

module.exports = attachFileSchema;
