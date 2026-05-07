/**
 * Swagger API Path Definitions for Customer Module
 */

const customerPaths = {
  '/customers/get-list': {
    post: {
      tags: ['Customer'],
      summary: 'Get list of customers',
      description: 'Fetch customer data from local database (bridge_sanbox.customers).',
      security: [{ bearerAuth: [] }],
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
  },
  '/customers/create': {
    post: {
      tags: ['Customer'],
      summary: 'Create a new customer',
      description: 'Create a new customer via external bridge API',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CustomerCreateRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CustomerCreateResponse' }
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
