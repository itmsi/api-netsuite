/**
 * Swagger API Path Definitions for Subsidiary Module
 */

const subsidiaryPaths = {
  '/subsidiary/get': {
    post: {
      tags: ['Subsidiary'],
      summary: 'Get list of subsidiary with pagination',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SubsidiaryListRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubsidiaryListResponse' }
            }
          }
        }
      }
    }
  },
  '/subsidiary/create': {
    post: {
      tags: ['Subsidiary'],
      summary: 'Create new subsidiary',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SubsidiaryCreateRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubsidiaryDetailResponse' }
            }
          }
        }
      }
    }
  },
  '/subsidiary/{id}': {
    get: {
      tags: ['Subsidiary'],
      summary: 'Get subsidiary by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubsidiaryDetailResponse' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Subsidiary'],
      summary: 'Update subsidiary by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SubsidiaryUpdateRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubsidiaryDetailResponse' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Subsidiary'],
      summary: 'Delete subsidiary by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' }
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

module.exports = subsidiaryPaths;
