/**
 * Swagger Paths for Vendor Prepayment Module
 */

const errorResponses = {
  401: {
    description: 'Unauthorized - Token tidak valid atau tidak ada',
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
};

const vendorPrepaymentPaths = {
  '/vendor-prepayment/get': {
    post: {
      tags: ['Vendor Prepayment'],
      summary: 'Get Vendor Prepayments List',
      description: 'Mendapatkan daftar vendor prepayment dari database lokal (tabel vendor_prepayments) dengan pagination, sorting, dan filtering',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/VendorPrepaymentListRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Berhasil mendapatkan daftar vendor prepayment',
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
                        items: { $ref: '#/components/schemas/VendorPrepayment' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer', example: 1 },
                          limit: { type: 'integer', example: 20 },
                          total: { type: 'integer', example: 25 },
                          totalPages: { type: 'integer', example: 2 }
                        }
                      }
                    }
                  },
                  sync_info: { type: 'object', nullable: true },
                  message: { type: 'string', example: 'Data vendor prepayments berhasil diambil' }
                }
              }
            }
          }
        },
        ...errorResponses
      }
    }
  },
  '/vendor-prepayment/sync/{netsuite_id}': {
    get: {
      tags: ['Vendor Prepayment'],
      summary: 'Sync Vendor Prepayment by Netsuite ID',
      description: 'Memaksa sinkronisasi satu vendor prepayment berdasarkan netsuite_id dari bridge API',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'netsuite_id',
          required: true,
          schema: { type: 'string' },
          description: 'Netsuite ID dari vendor prepayment yang akan di-sync',
          example: '28015'
        }
      ],
      responses: {
        200: {
          description: 'Berhasil sync vendor prepayment dari bridge API',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/VendorPrepaymentDetail' },
                  sync_info: { type: 'object', nullable: true },
                  message: { type: 'string', example: 'Vendor prepayment netsuite_id 28015 berhasil di-sync dari bridge API' }
                }
              }
            }
          }
        },
        404: {
          description: 'Not Found - Vendor prepayment tidak ditemukan di Netsuite',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        ...errorResponses
      }
    }
  },
  '/vendor-prepayment/{id}': {
    get: {
      tags: ['Vendor Prepayment'],
      summary: 'Get Vendor Prepayment by ID',
      description: 'Mendapatkan detail vendor prepayment berdasarkan ID (UUID) atau netsuite_id dari database lokal',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'UUID atau netsuite_id dari vendor prepayment',
          example: '28015'
        }
      ],
      responses: {
        200: {
          description: 'Berhasil mendapatkan detail vendor prepayment',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/VendorPrepaymentDetail' },
                  message: { type: 'string', example: 'Detail data vendor prepayment berhasil diambil' }
                }
              }
            }
          }
        },
        404: {
          description: 'Not Found - Data vendor prepayment tidak ditemukan',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        ...errorResponses
      }
    }
  }
};

module.exports = vendorPrepaymentPaths;
