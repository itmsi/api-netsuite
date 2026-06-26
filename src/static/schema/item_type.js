/**
 * Swagger Schema Definitions for Item Type Module
 */

const itemTypeSchemas = {
  ItemType: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      netsuite_id: { type: 'string', nullable: true, example: '123' },
      code: { type: 'string', example: 'INVT' },
      name: { type: 'string', example: 'Inventory Item' },
      created_at: { type: 'string', format: 'date-time', example: '2026-01-01T00:00:00.000Z' },
      created_by: { type: 'string', nullable: true, example: 'uuid-user-id' },
      updated_at: { type: 'string', format: 'date-time', example: '2026-01-01T00:00:00.000Z' },
      updated_by: { type: 'string', nullable: true, example: 'uuid-user-id' },
      deleted_at: { type: 'string', format: 'date-time', nullable: true, example: null },
      deleted_by: { type: 'string', nullable: true, example: null },
      is_deleted: { type: 'boolean', example: false }
    }
  },
  ItemTypeInput: {
    type: 'object',
    required: ['code', 'name'],
    properties: {
      netsuite_id: { type: 'string', nullable: true, example: '123', description: 'ID dari NetSuite (opsional)' },
      code: { type: 'string', example: 'INVT', description: 'Kode item type' },
      name: { type: 'string', example: 'Inventory Item', description: 'Nama item type' }
    }
  },
  ItemTypeUpdateInput: {
    type: 'object',
    properties: {
      netsuite_id: { type: 'string', nullable: true, example: '123', description: 'ID dari NetSuite (opsional)' },
      code: { type: 'string', example: 'INVT', description: 'Kode item type' },
      name: { type: 'string', example: 'Inventory Item', description: 'Nama item type' }
    }
  },
  ItemTypeListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/ItemType' }
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer', example: 1 },
                  limit: { type: 'integer', example: 10 },
                  total: { type: 'integer', example: 50 },
                  totalPages: { type: 'integer', example: 5 }
                }
              }
            }
          },
          message: { type: 'string', example: 'Data item type berhasil diambil' }
        }
      }
    }
  },
  ItemTypeDetailResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/ItemType' },
          message: { type: 'string', example: 'Detail item type berhasil diambil' }
        }
      }
    }
  }
};

module.exports = itemTypeSchemas;
