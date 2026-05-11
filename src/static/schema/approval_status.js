const approvalStatusSchemas = {
  ApprovalStatus: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      code: { type: 'string', example: 'APRV' },
      name: { type: 'string', example: 'Approved' },
      created_at: { type: 'string', format: 'date-time' },
      created_by: { type: 'string' },
      update_at: { type: 'string', format: 'date-time' },
      update_by: { type: 'string' },
      is_deleted: { type: 'boolean', example: false },
      deleted_at: { type: 'string', format: 'date-time' }
    }
  },
  ApprovalStatusListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/ApprovalStatus' }
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 50 },
              totalPages: { type: 'integer', example: 5 }
            }
          }
        }
      },
      message: { type: 'string' }
    }
  },
  ApprovalStatusResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: { $ref: '#/components/schemas/ApprovalStatus' },
      message: { type: 'string' }
    }
  }
};

module.exports = approvalStatusSchemas;
