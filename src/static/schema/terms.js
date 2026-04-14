/**
 * Swagger Schema Definitions for Terms Module
 */

const termsSchemas = {
  TermsRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      limit: { type: 'integer', default: 10, example: 10 },
      sort_by: { type: 'string', default: 'name', example: 'name' },
      sort_order: { type: 'string', default: 'DESC', example: 'DESC' },
      search: { type: 'string', default: '', example: 'after' }
    }
  },
  TermsListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'object', description: 'Term data from bridge API' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      message: { type: 'string', example: 'Data terms berhasil diambil' }
    }
  }
};

module.exports = termsSchemas;
