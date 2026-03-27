/**
 * Swagger API Path Definitions for Locations Module
 */

const locationsPaths = {
  '/locations/get-list': {
    post: {
      tags: ['Locations'],
      summary: 'Get list of locations',
      description: 'Fetch locations data from external bridge API with pagination/search support',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LocationsRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LocationsListResponse' }
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

module.exports = locationsPaths;
