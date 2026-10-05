/**
 * Swagger Schema Definitions for Netsuite Scripts Module
 */

const netsuiteScriptsSchemas = {
  NetsuiteScriptsRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      limit: { type: 'integer', default: 10, example: 10 },
      sort_by: { type: 'string', enum: ['created_at', 'updated_at', 'module', 'script_id'], default: 'created_at', example: 'created_at' },
      sort_order: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC', example: 'ASC' },
      search: { type: 'string', default: '', example: '', description: 'Cari (contains, case-insensitive) di kolom module dan script_id' }
    }
  },
  NetsuiteScriptItem: {
    type: 'object',
    properties: {
      module: { type: 'string', example: 'bill' },
      script_id: { type: 'string', example: '408' }
    }
  },
  NetsuiteScriptsListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/NetsuiteScriptItem' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      message: { type: 'string', example: 'Data netsuite scripts berhasil diambil' }
    }
  }
};

module.exports = netsuiteScriptsSchemas;
