/**
 * Swagger API Path Definitions for Invoice Sales Order Module
 */

const invoiceSalesOrderPaths = {
  '/invoice-sales-orders/get': {
    post: {
      tags: ['Invoice Sales Orders'],
      summary: 'Get list of invoice sales orders',
      description: 'Fetch invoice sales orders dengan pagination dari database lokal (bridge_sanbox.invoice_sales_orders). Data sudah tersimpan dari hasil sync sebelumnya via endpoint /sync. Field `fakture_id`, `faktur_updated_at`, `faktur_updated_by_name` otomatis di-populate dari local DB jika sudah pernah di-sync ke fakturs.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/InvoiceSalesOrderListRequest' }
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
                        items: { $ref: '#/components/schemas/InvoiceSalesOrder' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Data invoice sales orders berhasil diambil' }
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
  '/invoice-sales-orders/sync': {
    post: {
      tags: ['Invoice Sales Orders'],
      summary: 'Sync invoice sales orders dari bridge API',
      description: 'Fetch invoice sales orders langsung dari bridge API (NetSuite) dengan pagination, lalu secara otomatis men-sync data ke tabel `fakturs` dan `faktur_details` di local DB. Format response identik dengan `/get`. Gunakan endpoint ini untuk mendapatkan data real-time dari NetSuite.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/InvoiceSalesOrderListRequest' }
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
                        items: { $ref: '#/components/schemas/InvoiceSalesOrder' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Data invoice sales orders berhasil di-sync dari bridge API' }
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

module.exports = invoiceSalesOrderPaths;
