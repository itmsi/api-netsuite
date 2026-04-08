/**
 * Swagger API Path Definitions for Classes Module
 */

const classesPaths = {
  '/classes/get-list': {
    post: {
      tags: ['Classes'],
      summary: 'Get list of classes',
      description: 'Fetch classes data from external bridge API with pagination/search support',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ClassesRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClassesListResponse' }
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

module.exports = classesPaths;
