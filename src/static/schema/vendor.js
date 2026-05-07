/**
 * Swagger Schema Definitions for Vendors Module
 */

const vendorSchemas = {
  VendorRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      limit: { type: 'integer', default: 50, example: 50 },
      sort_by: { type: 'string', default: 'created_at', example: 'created_at' },
      sort_order: { type: 'string', default: 'desc', example: 'desc' },
      search: { type: 'string', default: '', example: '' },
      lastmodified: { type: 'string', nullable: true, example: '2025-11-21T10:00:00+07:00' },
      netsuite_id: { type: 'string', nullable: true, example: null }
    }
  },
  VendorListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'object', description: 'Vendor data from bridge API' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      message: { type: 'string', example: 'Data vendors berhasil diambil' }
    }
  }
};

module.exports = vendorSchemas;
