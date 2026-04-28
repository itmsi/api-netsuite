/**
 * Swagger Schema Definitions for Subsidiary Module (npwp_inlines)
 */

const subsidiarySchemas = {
  Subsidiary: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      company_name: { type: 'string', example: 'PT Example Indonesia' },
      abbreviation: { type: 'string', example: 'EXI' },
      nomor: { type: 'string', example: '01.234.567.8-012.000' },
      id_type: { type: 'string', example: 'NPWP' },
      country_code: { type: 'string', example: 'ID' },
      nitku: { type: 'string', example: '0000000000000000000000' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      created_by: { type: 'string', format: 'uuid' },
      updated_by: { type: 'string', format: 'uuid' }
    }
  },
  SubsidiaryListRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      limit: { type: 'integer', default: 10, example: 10 },
      search: { type: 'string', default: '', example: '' },
      sort_by: { type: 'string', default: 'created_at', example: 'created_at' },
      sort_order: { type: 'string', default: 'desc', example: 'desc' }
    }
  },
  SubsidiaryCreateRequest: {
    type: 'object',
    required: ['company_name'],
    properties: {
      company_name: { type: 'string', example: 'PT Example Indonesia' },
      abbreviation: { type: 'string', example: 'EXI' },
      nomor: { type: 'string', example: '01.234.567.8-012.000' },
      id_type: { type: 'string', example: 'NPWP' },
      country_code: { type: 'string', example: 'ID' },
      nitku: { type: 'string', example: '0000000000000000000000' }
    }
  },
  SubsidiaryUpdateRequest: {
    type: 'object',
    properties: {
      company_name: { type: 'string', example: 'PT Example Indonesia Updated' },
      abbreviation: { type: 'string', example: 'EXIU' },
      nomor: { type: 'string', example: '01.234.567.8-012.001' },
      id_type: { type: 'string', example: 'NPWP' },
      country_code: { type: 'string', example: 'ID' },
      nitku: { type: 'string', example: '0000000000000000000001' }
    }
  },
  SubsidiaryListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Data subsidiary berhasil diambil' },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/Subsidiary' }
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' }
            }
          }
        }
      }
    }
  },
  SubsidiaryDetailResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Detail data subsidiary berhasil diambil' },
      data: { $ref: '#/components/schemas/Subsidiary' }
    }
  }
};

module.exports = subsidiarySchemas;
