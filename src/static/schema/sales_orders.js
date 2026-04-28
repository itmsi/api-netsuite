/**
 * Swagger Schema Definitions for Sales Orders Module
 */

const salesOrdersSchema = {
  SalesOrderItem: {
    type: 'object',
    properties: {
      line_number: { type: 'integer', example: 1 },
      item_id: { type: 'string', example: '19593' },
      item_name: { type: 'string', example: 'Product A' },
      description: { type: 'string', example: 'Deskripsi Manual' },
      quantity: { type: 'number', example: 5 },
      shipped: { type: 'number', example: 0 },
      rate: { type: 'number', example: 1500000 },
      amount: { type: 'number', example: 7500000 },
      location_id: { type: 'integer', example: 19 },
      location_name: { type: 'string', example: 'Jakarta' }
    }
  },
  SalesOrder: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '7840' },
      tranid: { type: 'string', example: 'SO-0001' },
      tran_date: { type: 'string', nullable: true, example: '2026-03-20' },
      status_code: { type: 'string', example: 'A' },
      status_name: { type: 'string', example: 'Pending Approval' },
      customer_id: { type: 'string', example: '1052' },
      customer_name: { type: 'string', example: 'PT Contoh' },
      memo: { type: 'string', nullable: true, example: 'Catatan untuk SO ini' },
      last_modified: { type: 'string', example: '2026-04-15T16:36:48+07:00' },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/SalesOrderItem' }
      }
    }
  },
  SalesOrderListRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 10 },
      search: { type: 'string', example: '' },
      sort_by: { type: 'string', example: 'last_modified_netsuite' },
      sort_order: { type: 'string', enum: ['asc', 'desc', 'ASC', 'DESC'], example: 'desc' },
      customer_id: { type: 'integer', example: null },
      status_code: { type: 'string', example: null }
    }
  },
  SalesOrderSyncRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      page_size: { type: 'integer', example: 10 },
      sort_by: { type: 'string', example: 'last_modified_netsuite' },
      sort_order: { type: 'string', enum: ['ASC', 'DESC'], example: 'DESC' },
      filters: {
        type: 'object',
        example: {}
      }
    }
  },
  SalesOrderCreateRequest: {
    type: 'object',
    required: ['subsidiary', 'entity', 'trandate', 'items'],
    properties: {
      customform: { type: 'integer', example: 104 },
      subsidiary: { type: 'integer', example: 5 },
      entity: { type: 'integer', example: 1052 },
      trandate: { type: 'string', example: '20/3/2026' },
      startdate: { type: 'string', example: '20/3/2026' },
      enddate: { type: 'string', example: '23/3/2026' },
      orderstatus: { type: 'string', example: 'A' },
      otherrefnum: { type: 'string', example: '' },
      memo: { type: 'string', example: 'Catatan untuk SO ini' },
      currency: { type: 'integer', example: 1 },
      terms: { type: 'integer', example: 9 },
      department: { type: 'integer', example: 101 },
      class: { type: 'integer', example: 3 },
      location: { type: 'integer', example: 19 },
      custbody_msi_quotation_no_iec: { type: 'string', example: 'QT-001' },
      custbody_msi_bank_payment_so: { type: 'integer', example: 3 },
      custbody_cseg_cn_cfi: { type: 'integer', example: 4 },
      custbody_msi_createdby_api: { type: 'string', example: 'T' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            itemId: { type: 'integer', example: 19593 },
            qty: { type: 'number', example: 5 },
            rate: { type: 'number', example: 1500000 },
            amount: { type: 'number', example: 7500000 },
            description: { type: 'string', example: 'Deskripsi Manual' },
            department: { type: 'integer', example: 101 },
            class: { type: 'integer', example: 3 },
            location: { type: 'integer', example: 19 },
            taxcode: { type: 'integer', example: 18098 }
          }
        }
      }
    }
  },
  SalesOrderUpdateRequest: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', example: 7840 },
      customform: { type: 'integer', example: 104 },
      subsidiary: { type: 'integer', example: 5 },
      entity: { type: 'integer', example: 1052 },
      trandate: { type: 'string', example: '20/3/2026' },
      startdate: { type: 'string', example: '20/3/2026' },
      enddate: { type: 'string', example: '23/3/2026' },
      orderstatus: { type: 'string', example: 'A' },
      otherrefnum: { type: 'string', example: '' },
      memo: { type: 'string', example: 'Catatan untuk SO ini di edit' },
      currency: { type: 'integer', example: 1 },
      terms: { type: 'integer', example: 9 },
      department: { type: 'integer', example: 101 },
      class: { type: 'integer', example: 3 },
      location: { type: 'integer', example: 19 },
      custbody_msi_quotation_no_iec: { type: 'string', example: 'QT-001' },
      custbody_msi_bank_payment_so: { type: 'integer', example: 3 },
      custbody_cseg_cn_cfi: { type: 'integer', example: 4 },
      custbody_msi_createdby_api: { type: 'string', example: 'T' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            itemId: { type: 'integer', example: 19593 },
            qty: { type: 'number', example: 5 },
            rate: { type: 'number', example: 1500000 },
            amount: { type: 'number', example: 7500000 },
            description: { type: 'string', example: 'Deskripsi Manual' },
            department: { type: 'integer', example: 101 },
            class: { type: 'integer', example: 3 },
            location: { type: 'integer', example: 19 },
            taxcode: { type: 'integer', example: 18098 }
          }
        }
      }
    }
  }
};

module.exports = salesOrdersSchema;
