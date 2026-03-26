/**
 * Swagger API Path Definitions for Auth Module
 */

const authPaths = {
  '/auth/token': {
    get: {
      tags: ['Auth'],
      summary: 'Get access token from Motorsights Bridge API',
      description: 'Retrieve an access token using client credentials from the Motorsights Bridge API',
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
                      access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5c...'},
                      refresh_token: { type: 'string', example: '324ef038c61e88...'},
                      token_type: { type: 'string', example: 'Bearer' },
                      expires_in: { type: 'integer', example: 86400 },
                      refresh_token_expires_in: { type: 'integer', example: 86400 }
                    }
                  },
                  timestamp: { type: 'string', example: '2026-03-26T09:19:00.463Z' }
                }
              }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Internal Server Error' },
                  errors: { type: 'object' }
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = authPaths;
