/**
 * Swagger API Path Definitions for Invoice Sales Order Module
 */

const invoiceSalesOrderPaths = {
  '/invoice-sales-orders/get': {
    post: {
      tags: ['Invoice Sales Order'],
      summary: 'Get list of invoice sales orders',
      description: 'Fetch invoice sales orders from bridge API with pagination and filters',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/InvoiceSalesOrderRequest' }
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
                  data: { $ref: '#/components/schemas/InvoiceSalesOrderResponse' },
                  message: { type: 'string', example: 'Success! Task completed' }
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
