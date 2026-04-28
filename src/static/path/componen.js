/**
 * Swagger API Path Definitions for Componen Module
 */

const componenPaths = {
  '/componen/get-list': {
    get: {
      tags: ['Componen'],
      summary: 'Get list of componen',
      description: 'Fetch componen data from external bridge API',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ComponenListResponse' }
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

module.exports = componenPaths;
