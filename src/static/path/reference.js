/**
 * Reference Paths
 */

const referencePath = {
  '/reference/get': {
    post: {
      tags: ['Reference'],
      summary: 'Get all references with filters',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReferenceListRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'List of references'
        },
        401: {
          description: 'Unauthorized'
        }
      }
    }
  },
  '/reference/create': {
    post: {
      tags: ['Reference'],
      summary: 'Create new reference',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReferenceRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Reference created'
        }
      }
    }
  },
  '/reference/{id}': {
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' }
      }
    ],
    get: {
      tags: ['Reference'],
      summary: 'Get reference by ID',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Reference detail'
        }
      }
    },
    put: {
      tags: ['Reference'],
      summary: 'Update reference',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReferenceRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Reference updated'
        }
      }
    },
    delete: {
      tags: ['Reference'],
      summary: 'Soft delete reference',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Reference deleted'
        }
      }
    }
  }
};

module.exports = referencePath;
