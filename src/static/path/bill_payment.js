/**
 * Swagger API Path Definitions for Bill Payment Module
 */

const billPaymentPaths = {
  '/bill-payment/get': {
    post: {
      tags: ['Bill Payment'],
      summary: 'Get list of bill payments',
      description: 'Fetch bill payments list dari database lokal (bridge_sanbox.bills_payments). Data ini tersinkronisasi dari NetSuite.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BillPaymentListRequest' }
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
                        items: { $ref: '#/components/schemas/BillPayment' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Data bill payments berhasil diambil' }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
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
  '/bill-payment/sync': {
    post: {
      tags: ['Bill Payment'],
      summary: 'Sync bill payments dari bridge API',
      description: 'Sync trigger yang mengambil data langsung dari endpoint NetSuite via API bridge, diperbarui ke DB lokal.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BillPaymentListRequest' }
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
                        items: { $ref: '#/components/schemas/BillPayment' }
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
                  message: { type: 'string', example: 'Data bill payments berhasil di-sync dari bridge API' }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
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
  '/bill-payment/{id}': {
    get: {
      tags: ['Bill Payment'],
      summary: 'Get bill payment detail by ID',
      description: 'Fetch detail satu record bill payment berdasarkan UUID dari database lokal (bridge_sanbox.bills_payments).',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'UUID dari kolom `id` atau integer dari kolom `netsuite_id`',
          schema: { type: 'string', example: 'f7b3d24b-9ddd-481c-87df-fd8fe7848ec3' }
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
                  data: { $ref: '#/components/schemas/BillPayment' },
                  message: { type: 'string', example: 'Detail data bill payment berhasil diambil' }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        404: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Data bill payment tidak ditemukan' }
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

module.exports = billPaymentPaths;
