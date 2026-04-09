/**
 * Swagger Schema Definitions for Classes Module
 */

const classesSchemas = {
  ClassesRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      limit: { type: 'integer', default: 10, example: 10 },
      page_size: { type: 'integer', default: 10, example: 10 },
      sort_by: { type: 'string', default: 'last_modified', example: 'last_modified' },
      sort_order: { type: 'string', default: 'DESC', example: 'DESC' },
      search: { type: 'string', default: '', example: '' },
      subsidiary_id: { type: 'string', example: '1' },
      lastmodified: { type: 'string', example: '2026-01-01T00:00:00' },
      class_profile: { type: 'string', example: '1' }
    }
  },
  ClassesListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'object', description: 'Class data from bridge API' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      message: { type: 'string', example: 'Data classes berhasil diambil' }
    }
  }
};

module.exports = classesSchemas;
