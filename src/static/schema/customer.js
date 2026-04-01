/**
 * Swagger Schema Definitions for Customer Module
 */

const customerSchemas = {
  CustomerRequest: {
    type: 'object',
    properties: {
      pageSize: { type: 'integer', default: 50, example: 50 },
      pageIndex: { type: 'integer', default: 0, example: 0 },
      lastmodified: { type: 'string', format: 'date-time', example: '2025-11-21T10:00:00+07:00' },
      netsuite_id: { type: 'string', nullable: true, example: null }
    }
  },
  CustomerListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'object', description: 'Customer data from bridge API' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      message: { type: 'string', example: 'Data customers berhasil diambil' }
    }
  }
};

module.exports = customerSchemas;
