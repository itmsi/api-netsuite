/**
 * Swagger Schema Definitions for Items Module
 */

const itemsSchemas = {
  ItemsRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      limit: { type: 'integer', default: 10, example: 10 },
      sort_by: { type: 'string', default: 'created_at', example: 'created_at' },
      sort_order: { type: 'string', default: 'desc', example: 'desc' },
      search: { type: 'string', default: '', example: '' },
      lastmodified: { type: 'string', nullable: true, example: '2026-03-18T08:56:00+07:00' },
      netsuite_id: { type: 'string', nullable: true, example: null }
    }
  },
  ItemsListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'object', description: 'Item data from bridge API' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      message: { type: 'string', example: 'Data items berhasil diambil' }
    }
  }
};

module.exports = itemsSchemas;
