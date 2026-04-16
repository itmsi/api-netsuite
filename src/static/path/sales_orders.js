/**
 * Swagger API Path Definitions for Sales Orders Module
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

const salesOrdersPaths = {
  '/sales-orders/get': {
    post: {
      tags: ['Sales Orders'],
      summary: 'Get list of sales orders',
      description: 'Fetch sales orders dengan pagination dari database lokal (bridge_sanbox.sales_orders). Response termasuk `sync_info` dari tabel `syncs`.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SalesOrderListRequest' }
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
                      items: { type: 'array', items: { $ref: '#/components/schemas/SalesOrder' } },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  sync_info: syncInfoSchema,
                  message: { type: 'string', example: 'Data sales orders berhasil diambil' }
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

  '/sales-orders/sync': {
    post: {
      tags: ['Sales Orders'],
      summary: 'Sync sales orders dari bridge API',
      description: 'Hit bridge API `POST /api/v1/bridge/sales-orders/get` untuk sync data sales orders. Hasil sync dicatat di tabel `syncs` dan `sync_info` dikembalikan di response.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SalesOrderSyncRequest' }
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
                  data: { type: 'object', description: 'Raw response dari bridge API' },
                  sync_info: syncInfoSchema,
                  message: { type: 'string', example: 'Data sales orders berhasil di-sync dari bridge API' }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/sales-orders/create': {
    post: {
      tags: ['Sales Orders'],
      summary: 'Create a new sales order',
      description: 'Create a new sales order via bridge API `POST /api/v1/bridge/sales-orders/create`.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SalesOrderCreateRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Sales order created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object', description: 'Raw response dari bridge API' },
                  message: { type: 'string', example: 'Sales order berhasil dibuat' }
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

  '/sales-orders/update': {
    put: {
      tags: ['Sales Orders'],
      summary: 'Update an existing sales order',
      description: 'Update a sales order via bridge API `PUT /api/v1/bridge/sales-orders/update`. Field `id` wajib diisi.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SalesOrderUpdateRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Sales order updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object', description: 'Raw response dari bridge API' },
                  message: { type: 'string', example: 'Sales order berhasil diupdate' }
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

  '/sales-orders/{id}': {
    get: {
      tags: ['Sales Orders'],
      summary: 'Get sales order by ID dari DB lokal',
      description: 'Fetch single sales order dari database lokal (bridge_sanbox.sales_orders) berdasarkan `netsuite_id`.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'NetSuite internal ID dari sales order (netsuite_id)',
          schema: { type: 'integer', example: 7840 }
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
                  data: {
                    type: 'object',
                    properties: {
                      items: { type: 'array', items: { $ref: '#/components/schemas/SalesOrder' } },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  sync_info: syncInfoSchema,
                  message: { type: 'string', example: 'Data sales order ID 7840 berhasil diambil' }
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

module.exports = salesOrdersPaths;
