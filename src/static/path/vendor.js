/**
 * Swagger API Path Definitions for Vendors Module
 */

const vendorPaths = {
  '/vendor/get-list': {
    post: {
      tags: ['Vendors'],
      summary: 'Get list of vendors',
      description: 'Fetch vendors data from external bridge API',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/VendorRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VendorListResponse' }
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

module.exports = vendorPaths;
