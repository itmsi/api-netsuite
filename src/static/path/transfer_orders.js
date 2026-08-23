/**
 * Swagger API Path Definitions for Transfer Orders Module
 */

const syncInfoSchema = {
  type: 'object',
  nullable: true,
  properties: {
    sync_status: { type: 'string', example: 'success' },
    created_at: { type: 'string', example: '2026-04-15T07:44:27.781Z' },
    created_by_name: { type: 'string', nullable: true, example: 'abdul harris' }
  }
};

const transferOrdersPaths = {
  '/transfer-orders/get-list': {
    post: {
      tags: ['Transfer Orders'],
      summary: 'Get list of transfer orders',
      description: 'Fetch transfer orders dengan pagination dari database lokal (bridge_sanbox.transfer_orders). Response termasuk `sync_info` dari tabel `syncs`.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/TransferOrderListRequest' }
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
                      items: { type: 'array', items: { $ref: '#/components/schemas/TransferOrder' } },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  sync_info: syncInfoSchema,
                  message: { type: 'string', example: 'Data transfer orders berhasil diambil' }
                }
              }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/transfer-orders/create': {
    post: {
      tags: ['Transfer Orders'],
      summary: 'Create a new transfer order',
      description: 'Create a new transfer order via bridge API `POST /api/v1/bridge/transfer-orders/create`. Data disimpan ke tabel lokal `transfer_orders` lalu diproses secara asynchronous melalui RabbitMQ.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/TransferOrderCreateRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Transfer order created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      toId: { type: 'string', example: 'f0b57258-5f33-4e03-81f7-cd70d833b5c5' },
                      local_id: { type: 'integer', example: 101 }
                    }
                  },
                  message: { type: 'string', example: 'Transfer order berhasil dibuat' }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/transfer-orders/update': {
    put: {
      tags: ['Transfer Orders'],
      summary: 'Update an existing transfer order',
      description: 'Update a transfer order via bridge API `POST /api/v1/bridge/transfer-orders/update`. Field `id` wajib diisi dan merupakan NetSuite internal ID atau UUID lokal dari transfer order.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/TransferOrderUpdateRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Transfer order update initiated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      toId: { type: 'string', example: 'f0b57258-5f33-4e03-81f7-cd70d833b5c5' },
                      local_id: { type: 'integer', example: 102 }
                    }
                  },
                  message: { type: 'string', example: 'Transfer order update berhasil diinisiasi' }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        404: {
          description: 'Not Found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/transfer-orders/sync/{id}': {
    post: {
      tags: ['Transfer Orders'],
      summary: 'Sync single transfer order by ID',
      description: 'Sync single transfer order dari bridge API `POST /api/v1/bridge/transfer-orders/sync/{id}`. Parameter `id` bisa berupa UUID lokal atau NetSuite internal ID (netsuite_id); akan di-resolve dulu ke NetSuite ID sebelum hit bridge API.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'UUID lokal atau NetSuite internal ID (netsuite_id) dari transfer order',
          schema: { type: 'string', example: '52362' }
        }
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object', description: 'Raw response dari bridge API' },
                  sync_info: syncInfoSchema,
                  message: { type: 'string', example: 'Transfer order ID 52362 berhasil di-sync dari bridge API' }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        404: {
          description: 'Not Found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/transfer-orders/{id}': {
    get: {
      tags: ['Transfer Orders'],
      summary: 'Get transfer order by ID dari DB lokal',
      description: 'Fetch single transfer order dari database lokal (bridge_sanbox.transfer_orders) berdasarkan NetSuite internal ID (netsuite_id) atau UUID lokal (id).',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'NetSuite internal ID (netsuite_id) atau UUID lokal (id) dari transfer order',
          schema: { type: 'string', example: '52362' }
        }
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: '' },
                  data: { type: 'array', items: { $ref: '#/components/schemas/TransferOrder' } },
                  timestamp: { type: 'string', example: '2026-08-24T07:44:27.781Z' }
                }
              }
            }
          }
        },
        404: {
          description: 'Not Found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  }
};

module.exports = transferOrdersPaths;
