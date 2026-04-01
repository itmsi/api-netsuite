/**
 * Swagger API Path Definitions for Invoice Sales Order Module
 */

const invoiceSalesOrderPaths = {
  '/invoice-sales-orders/get': {
    post: {
      tags: ['Invoice Sales Orders'],
      summary: 'Get list of invoice sales orders',
      description: 'Fetch invoice sales orders from internal bridge API with pagination and search',
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
  }
};

module.exports = invoiceSalesOrderPaths;
