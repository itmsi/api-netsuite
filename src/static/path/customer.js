/**
 * Swagger API Path Definitions for Customer Module
 */

const customerPaths = {
  '/customers/get-list': {
    post: {
      tags: ['Customer'],
      summary: 'Get list of customers',
      description: 'Fetch customer data from external bridge API with pagination support',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CustomerRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CustomerListResponse' }
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

module.exports = customerPaths;
