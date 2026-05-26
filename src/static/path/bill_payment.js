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
  }
};

module.exports = billPaymentPaths;
