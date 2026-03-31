/**
 * Swagger API Path Definitions for Faktur Module
 */

const fakturPaths = {
  '/faktur/get': {
    post: {
      tags: ['Faktur'],
      summary: 'Get list of faktur',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/FakturListRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FakturListResponse' }
            }
          }
        }
      }
    }
  },
  '/faktur/create': {
    post: {
      tags: ['Faktur'],
      summary: 'Create new faktur',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/FakturRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FakturResponse' }
            }
          }
        }
      }
    }
  },
  '/faktur/{id}': {
    get: {
      tags: ['Faktur'],
      summary: 'Get faktur by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FakturResponse' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Faktur'],
      summary: 'Update faktur by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/FakturRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FakturResponse' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Faktur'],
      summary: 'Delete faktur by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      responses: {
        200: {
          description: 'Deleted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = fakturPaths;
