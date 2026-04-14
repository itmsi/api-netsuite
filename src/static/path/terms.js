/**
 * Swagger API Path Definitions for Terms Module
 */

const termsPaths = {
  '/terms/get-list': {
    post: {
      tags: ['Terms'],
      summary: 'Get list of terms',
      description: 'Fetch terms data from external bridge API with pagination/search support',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/TermsRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TermsListResponse' }
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

module.exports = termsPaths;
