/**
 * Reference Schema
 */

const referenceSchema = {
  Reference: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: 'f0b57258-5f33-4e03-81f7-cd70d833b5c5'
      },
      type: {
        type: 'string',
        example: 'Satuan Ukur'
      },
      code: {
        type: 'string',
        example: 'UM.0007'
      },
      description: {
        type: 'string',
        example: 'Liter'
      },
      code_transaksi: {
        type: 'string',
        nullable: true,
        example: '07'
      },
      created_at: {
        type: 'string',
        format: 'date-time'
      },
      updated_at: {
        type: 'string',
        format: 'date-time'
      }
    }
  },
  ReferenceRequest: {
    type: 'object',
    required: ['type', 'code'],
    properties: {
      type: {
        type: 'string',
        example: 'Satuan Ukur'
      },
      code: {
        type: 'string',
        example: 'UM.0007'
      },
      description: {
        type: 'string',
        example: 'Liter'
      },
      code_transaksi: {
        type: 'string',
        example: '07'
      }
    }
  },
  ReferenceListRequest: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        default: 1
      },
      limit: {
        type: 'integer',
        default: 10
      },
      search: {
        type: 'string'
      },
      sort_by: {
        type: 'string',
        default: 'created_at'
      },
      sort_order: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc'
      },
      type: {
        type: 'string'
      },
      code: {
        type: 'string'
      },
      description: {
        type: 'string'
      },
      code_transaksi: {
        type: 'string'
      }
    }
  }
};

module.exports = referenceSchema;
