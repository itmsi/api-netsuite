/**
 * Swagger Schema Definitions for Sync Module
 */

const syncSchemas = {
  SyncGetRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      limit: { type: 'integer', default: 10, example: 10 },
      search: { type: 'string', default: '', example: '' },
      sort_by: { type: 'string', default: 'created_at', example: 'created_at' },
      sort_order: { type: 'string', default: 'desc', example: 'desc', enum: ['asc', 'desc'] }
    }
  },

  SyncCreateRequest: {
    type: 'object',
    properties: {
      sync_module: {
        type: 'string',
        nullable: true,
        maxLength: 255,
        example: 'purchase_order'
      },
      sync_status: {
        type: 'string',
        nullable: true,
        example: 'pending'
      }
    }
  },

  SyncItem: {
    type: 'object',
    properties: {
      sync_id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      sync_module: { type: 'string', nullable: true, example: 'purchase_order' },
      sync_status: { type: 'string', nullable: true, example: 'pending' },
      created_at: { type: 'string', format: 'date-time' },
      created_by: { type: 'string', format: 'uuid', nullable: true },
      updated_at: { type: 'string', format: 'date-time' },
      updated_by: { type: 'string', format: 'uuid', nullable: true },
      is_delete: { type: 'boolean', example: false }
    }
  },

  SyncListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Success' },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/SyncItem' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      timestamp: { type: 'string', format: 'date-time' }
    }
  },

  SyncItemResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Success' },
      data: { $ref: '#/components/schemas/SyncItem' },
      timestamp: { type: 'string', format: 'date-time' }
    }
  }
};

module.exports = syncSchemas;
