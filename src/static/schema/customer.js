/**
 * Swagger Schema Definitions for Customer Module
 */

const customerSchemas = {
  CustomerRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      page_size: { type: 'integer', default: 50, example: 50 },
      sort_by: { type: 'string', default: 'lastModifiedDate', example: 'lastModifiedDate' },
      sort_order: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC', example: 'DESC' },
      is_sync: { type: 'boolean', default: true, example: true },
      filters: {
        type: 'object',
        properties: {
          internalid: { 
            oneOf: [
              { type: 'array', items: { type: 'integer' } },
              { type: 'string' },
              { type: 'integer' }
            ],
            example: [1, 2]
          },
          entityid: { type: 'string', example: 'CUST-001' },
          companyname: { type: 'string', example: 'customer test 011' },
          email: { type: 'string', example: 'customer@example.com' },
          phone: { type: 'string', example: '08123456789' },
          lastmodified: { type: 'string', format: 'date-time', example: '2026-04-20T23:59:00+07:00' }
        }
      }
    }
  },
  CustomerListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { type: 'object' }, description: 'Customer data from local database (bridge_sanbox)' },
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
