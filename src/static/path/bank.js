/**
 * Swagger API Path Definitions for Bank Module
 */

const bankPaths = {
  '/bank/get': {
    post: {
      tags: ['Bank'],
      summary: 'Get list of banks',
      description: 'Fetch banks list dari database lokal (bridge_sanbox.banks). Data ini tersinkronisasi dari NetSuite.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BankListRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      items: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Bank' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Data banks berhasil diambil' }
                }
              }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/bank/sync': {
    post: {
      tags: ['Bank'],
      summary: 'Sync banks dari bridge API',
      description: 'Sync trigger yang mengambil data langsung dari endpoint NetSuite via API bridge, diperbarui ke DB lokal.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BankListRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      items: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Bank' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  sync_info: {
                    type: 'object',
                    properties: {
                      lastSync: { type: 'string', format: 'date-time' },
                      status: { type: 'string', example: 'success' }
                    }
                  },
                  message: { type: 'string', example: 'Data banks berhasil di-sync dari bridge API' }
                }
              }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  }
};

module.exports = bankPaths;
