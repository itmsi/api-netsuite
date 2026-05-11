const approvalStatusPaths = {
  '/approval_status/get': {
    post: {
      tags: ['Approval Status'],
      summary: 'Get list of Approval Status',
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
            'application/json': { schema: { $ref: '#/components/schemas/ApprovalStatusListResponse' } }
          }
        }
      }
    }
  },
  '/approval_status/create': {
    post: {
      tags: ['Approval Status'],
      summary: 'Create Approval Status',
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
            'application/json': { schema: { $ref: '#/components/schemas/ApprovalStatusResponse' } }
          }
        }
      }
    }
  },
  '/approval_status/{id}': {
    get: {
      tags: ['Approval Status'],
      summary: 'Get Approval Status by ID',
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
            'application/json': { schema: { $ref: '#/components/schemas/ApprovalStatusResponse' } }
          }
        }
      }
    },
    put: {
      tags: ['Approval Status'],
      summary: 'Update Approval Status',
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
            'application/json': { schema: { $ref: '#/components/schemas/ApprovalStatusResponse' } }
          }
        }
      }
    },
    delete: {
      tags: ['Approval Status'],
      summary: 'Delete Approval Status (Soft Delete)',
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

module.exports = approvalStatusPaths;
