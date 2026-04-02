/**
 * Swagger Schema Definitions for Locations Module
 */

const locationsSchemas = {
  LocationsRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      limit: { type: 'integer', default: 10, example: 10 },
      sort_by: { type: 'string', default: 'created_at', example: 'created_at' },
      sort_order: { type: 'string', default: 'desc', example: 'desc' },
      search: { type: 'string', default: '', example: '' },
      is_parent: { type: 'boolean', example: true }
    }
  },
  LocationsListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'object', description: 'Location data from bridge API' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      message: { type: 'string', example: 'Data locations berhasil diambil' }
    }
  }
};

module.exports = locationsSchemas;
