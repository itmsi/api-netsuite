/**
 * Swagger Schema Definitions for Customer Module
 */

const customerSchemas = {
  CustomerRequest: {
    type: 'object',
    properties: {
      pageSize: { type: 'integer', default: 50, example: 50 },
      pageIndex: { type: 'integer', default: 0, example: 0 },
      lastmodified: { type: 'string', format: 'date-time', example: '2025-11-21T10:00:00+07:00' },
      netsuite_id: { type: 'string', nullable: true, example: null }
    }
  },
  CustomerListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'object', description: 'Customer data from bridge API' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      message: { type: 'string', example: 'Data customers berhasil diambil' }
    }
  },
  CustomerCreateRequest: {
    type: 'object',
    properties: {
      isPerson: { type: 'boolean', example: false },
      companyName: { type: 'string', example: 'PT TEST CUSTOMER DARI API' },
      customer_code: { type: 'string', example: 'TTC001' },
      subsidiary: { type: 'integer', example: 1 },
      subsidiaries: { type: 'array', items: { type: 'integer' }, example: [1] },
      email: { type: 'string', example: 'ahhj@ttc.com' },
      phone: { type: 'string', example: '081227724400' },
      lifetime: { type: 'integer', example: 1 },
      value: { type: 'integer', example: 1 },
      entitystatus: { type: 'integer', example: 13 },
      address: {
        type: 'object',
        properties: {
          defaultbilling: { type: 'boolean', example: true },
          defaultshipping: { type: 'boolean', example: true },
          addr1: { type: 'string', example: 'Jl Sudirman No 1' },
          city: { type: 'string', example: '' },
          state: { type: 'string', example: '' },
          zip: { type: 'string', example: '' },
          country: { type: 'string', example: 'ID' }
        }
      }
    }
  },
  CustomerCreateResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: { type: 'object', description: 'Response from bridge API' },
      message: { type: 'string', example: 'Customer berhasil dibuat' }
    }
  }
};

module.exports = customerSchemas;
