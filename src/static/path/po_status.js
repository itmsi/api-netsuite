const poStatusPaths = {
  '/po_status/get': {
    post: {
      tags: ['PO Status'],
      summary: 'Get list of PO Status',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                page: { type: 'integer', default: 1 },
                limit: { type: 'integer', default: 10 },
                search: { type: 'string' },
                sort_by: { type: 'string', default: 'created_at' },
                sort_order: { type: 'string', default: 'desc' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PoStatusListResponse' } }
          }
        }
      }
    }
  },
  '/po_status/create': {
    post: {
      tags: ['PO Status'],
      summary: 'Create PO Status',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code', 'name'],
              properties: {
                code: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PoStatusResponse' } }
          }
        }
      }
    }
  },
  '/po_status/{id}': {
    get: {
      tags: ['PO Status'],
      summary: 'Get PO Status by ID',
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
            'application/json': { schema: { $ref: '#/components/schemas/PoStatusResponse' } }
          }
        }
      }
    },
    put: {
      tags: ['PO Status'],
      summary: 'Update PO Status',
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
            schema: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PoStatusResponse' } }
          }
        }
      }
    },
    delete: {
      tags: ['PO Status'],
      summary: 'Delete PO Status (Soft Delete)',
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
          description: 'Success'
        }
      }
    }
  }
};

module.exports = poStatusPaths;
