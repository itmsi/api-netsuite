/**
 * Swagger Schema Definitions for Bank Module
 */

const bankSchema = {
  Bank: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '2' },
      name: { type: 'string', example: 'MANDIRI - IEC - 1240014272216' },
      isinactive: { type: 'boolean', example: false }
    }
  },
  BankListRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      page_size: { type: 'integer', example: 20 },
      sort_by: { type: 'string', example: 'name' },
      sort_order: { type: 'string', enum: ['ASC', 'DESC'], example: 'DESC' },
      filters: {
        type: 'object',
        properties: {
          is_inactive: { type: 'boolean', example: false },
          search: { type: 'string', example: 'mandiri' }
        }
      }
    }
  }
};

module.exports = bankSchema;
