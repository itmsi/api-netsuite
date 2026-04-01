/**
 * Swagger Schema Definitions for Invoice Sales Order Module
 */

const invoiceSalesOrderSchemas = {
  InvoiceSalesOrderLine: {
    type: 'object',
    properties: {
      item: { type: 'string', example: '26607' },
      line: { type: 'integer', example: 1 },
      memo: { type: 'string', nullable: true, example: null },
      rate: { type: 'number', example: 13400000 },
      price: { type: 'string', example: '-1' },
      tax1amt: { type: 'number', example: -1474000 },
      taxcode: { type: 'string', example: '18097' },
      grossamt: { type: 'number', example: 14874000 },
      itemtype: { type: 'string', example: 'InvtPart' },
      quantity: { type: 'integer', example: 1 },
      taxrate1: { type: 'number', example: 0.11 },
      netamount: { type: 'number', example: 13400000 },
      item_display: { type: 'string', example: 'MSI003 - MS600 6X4 DUMP TRUCK WEICHAI' },
      price_display: { type: 'string', example: 'Kustom' },
      custcol_me_tier_price: { type: 'string', nullable: true, example: null }
    }
  },
  InvoiceSalesOrder: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '2532' },
      tranid: { type: 'string', example: 'SI-IEC-2026-000009' },
      entity: { type: 'string', example: '205' },
      trandate: { type: 'string', example: '24/3/2026' },
      startdate: { type: 'string', example: '' },
      enddate: { type: 'string', example: '' },
      postingperiod: { type: 'string', example: '22' },
      otherrefnum: { type: 'string', nullable: true, example: null },
      memo: { type: 'string', example: 'bill untuk unit IEC-VIN-1' },
      custbody_me_related_fulfillment: { type: 'string', nullable: true, example: null },
      terms: { type: 'string', nullable: true, example: null },
      account: { type: 'string', example: '119' },
      currency: { type: 'string', example: '1' },
      exchangerate: { type: 'string', example: '1.00' },
      custbody_msi_bank_payment_so: { type: 'string', example: '1,3' },
      approvalstatus: { type: 'string', example: '2' },
      custbody_me_wf_created_by: { type: 'string', example: '765' },
      custbody_me_wf_next_approver_blank: { type: 'string', nullable: true, example: null },
      saleseffectivedate: { type: 'string', example: '24/3/2026' },
      createdfrom: { type: 'string', example: '2515' },
      subsidiary: { type: 'string', example: '5' },
      department: { type: 'string', example: '8' },
      class: { type: 'string', example: '1' },
      location: { type: 'string', example: '19' },
      custbody_cseg_cn_cfi: { type: 'string', example: '1' },
      custbody_me_description: { type: 'string', nullable: true, example: null },
      lines: {
        type: 'array',
        items: { $ref: '#/components/schemas/InvoiceSalesOrderLine' }
      }
    }
  },
  InvoiceSalesOrderRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      page_size: { type: 'integer', default: 20, example: 20 },
      sort_by: { type: 'string', default: 'trandate', example: 'trandate' },
      sort_order: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC', example: 'DESC' },
      filters: {
        type: 'object',
        properties: {
          tranid: { type: 'string', example: 'SI-IEC-2026-000009' },
          approvalstatus: { type: 'string', example: '1' },
          lastmodified: { type: 'string', format: 'date-time', example: '2025-03-25T00:00:00' }
        }
      }
    }
  },
  InvoiceSalesOrderResponse: {
    type: 'object',
    properties: {
      status: { type: 'string', example: 'success' },
      page: { type: 'integer', example: 1 },
      page_size: { type: 'integer', example: 1 },
      total_records: { type: 'integer', example: 1 },
      total_pages: { type: 'integer', example: 1 },
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/InvoiceSalesOrder' }
      }
    }
  }
};

module.exports = invoiceSalesOrderSchemas;
