/**
 * Swagger API Path Definitions for Purchasing Orders Module
 */

const purchasingOrdersPaths = {
  '/purchasing-orders/get-list': {
    post: {
      tags: ['Purchasing Orders'],
      summary: 'Get list of purchase orders',
      description: 'Fetch purchase orders with pagination from external bridge API API',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PurchaseOrderListRequest' }
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
                        items: { $ref: '#/components/schemas/PurchaseOrder' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Data purchase orders berhasil diambil' }
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
  '/purchasing-orders/create': {
    post: {
      tags: ['Purchasing Orders'],
      summary: 'Create a new purchase order',
      description: 'Create a new purchase order via bridge API and return the result from NetSuite',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PurchaseOrderCreateRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Purchase order created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object', description: 'Raw response from bridge API' },
                  message: { type: 'string', example: 'Purchase order berhasil dibuat' }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request - validation error from bridge API',
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

module.exports = purchasingOrdersPaths;
