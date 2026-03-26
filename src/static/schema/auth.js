/**
 * Swagger Schema Definitions for Auth Module
 */

const authSchemas = {
  AuthToken: {
    type: 'object',
    properties: {
      access_token: {
        type: 'string',
        description: 'Access token for bridge API'
      },
      refresh_token: {
        type: 'string',
        description: 'Refresh token for bridge API'
      },
      token_type: {
        type: 'string',
        example: 'Bearer'
      },
      expires_in: {
        type: 'integer',
        example: 86400
      },
      refresh_token_expires_in: {
        type: 'integer',
        example: 86400
      }
    }
  }
};

module.exports = authSchemas;
