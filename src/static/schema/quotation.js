/**
 * Swagger Schema Definitions for Quotation Module
 */

const quotationSchema = {
  Quotation: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      netsuite_id: { type: 'integer', example: 12345 },
      tranid: { type: 'string', example: 'QT-00001' },
      tran_date: { type: 'string', format: 'date-time', example: '2024-01-15T00:00:00Z' },
      duedate: { type: 'string', format: 'date-time', example: '2024-02-15T00:00:00Z' },
      entitystatus: { type: 'string', example: 'Open' },
      entitystatus_name: { type: 'string', example: 'Open Quotation' },
      probability: { type: 'integer', example: 50 },
      expectedclosedate: { type: 'string', format: 'date-time', example: '2024-03-01T00:00:00Z' },
      custbody_me_approval_status: { type: 'string', example: '1' },
      custbody_me_approval_status_name: { type: 'string', example: 'Pending Approval' },
      custbody_me_wf_created_by: { type: 'string', example: '10' },
      custbody_me_wf_created_by_name: { type: 'string', example: 'John Doe' },
      salesrep: { type: 'string', example: '5' },
      salesrep_name: { type: 'string', example: 'Jane Smith' },
      opportunity: { type: 'string', example: 'OPP-001' },
      opportunity_name: { type: 'string', example: 'Project X Opportunity' },
      forecasttype: { type: 'string', example: 'Upside' },
      forecasttype_name: { type: 'string', example: 'Upside Forecast' },
      partner: { type: 'string', example: 'PT Partner' },
      partner_name: { type: 'string', example: 'Partner Name' },
      status_code: { type: 'string', example: 'A' },
      status_name: { type: 'string', example: 'Active' },
      customer_id: { type: 'string', example: 'CUST-001' },
      customer_name: { type: 'string', example: 'PT Customer Indonesia' },
      memo: { type: 'string', example: 'Quotation for Project X' },
      approvalstatus: { type: 'string', example: '2' },
      otherrefnum: { type: 'string', example: 'REF-001' },
      department: { type: 'string', example: '1' },
      department_name: { type: 'string', example: 'Sales' },
      class_id: { type: 'string', example: '2' },
      class_name: { type: 'string', example: 'Class A' },
      location: { type: 'string', example: '1' },
      location_name: { type: 'string', example: 'Jakarta' },
      subsidiary: { type: 'string', example: '3' },
      subsidiary_name: { type: 'string', example: 'PT Motorsights Indonesia' },
      currency: { type: 'string', example: '1' },
      currency_name: { type: 'string', example: 'IDR' },
      custbody_msi_bank_payment_so: { type: 'string', example: '1' },
      custbody_msi_bank_payment_so_name: { type: 'string', example: 'Mandiri' },
      custbody_cseg_cn_cfi: { type: 'string', example: 'CFI-1' },
      custbody_cseg_cn_cfi_name: { type: 'string', example: 'CFI Name' },
      total_amount: { type: 'number', format: 'double', example: 5000000.00 },
      last_modified_netsuite: { type: 'string', format: 'date-time', example: '2024-01-15T10:00:00Z' },
      datecreated: { type: 'string', format: 'date-time', example: '2024-01-15T09:00:00Z' },
      items: { type: 'object', nullable: true, example: null },
      is_deleted: { type: 'boolean', example: false },
      created_at: { type: 'string', format: 'date-time', example: '2024-01-15T10:00:00Z' },
      updated_at: { type: 'string', format: 'date-time', example: '2024-01-15T10:00:00Z' },
      created_by: { type: 'string', format: 'uuid', nullable: true, example: null },
      updated_by: { type: 'string', format: 'uuid', nullable: true, example: null }
    }
  },
  QuotationListRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 10 },
      sort_by: {
        type: 'string',
        example: 'tran_date',
        enum: [
          'id', 'netsuite_id', 'tranid', 'tran_date', 'customer_name',
          'total_amount', 'status_name', 'approvalstatus', 'created_at', 'updated_at'
        ]
      },
      sort_order: { type: 'string', enum: ['asc', 'desc'], example: 'desc' },
      search: { type: 'string', description: 'Search by tranid, customer_name, atau memo', example: '' },
      is_deleted: { type: 'boolean', example: false },
      customer_id: { type: 'string', example: '100' },
      subsidiary: { type: 'string', example: '1' },
      approvalstatus: { type: 'string', example: '2' },
      classes: { type: 'string', example: '', nullable: true },
      tran_date_from: { type: 'string', format: 'date', example: '2024-01-01' },
      tran_date_to: { type: 'string', format: 'date', example: '2024-12-31' }
    }
  },
  QuotationLineItem: {
    type: 'object',
    required: ['itemId', 'qty', 'rate'],
    properties: {
      itemId: { type: 'integer', example: 19593 },
      qty: { type: 'number', example: 5 },
      rate: { type: 'number', example: 1500000 },
      amount: { type: 'number', example: 7500000 },
      description: { type: 'string', example: 'Deskripsi item' },
      department: { type: 'integer', example: 101 },
      class: { type: 'integer', example: 3 },
      location: { type: 'integer', example: 19 },
      taxcode: { type: 'integer', example: 18098 },
      pricelevel: { type: 'integer', example: 1 },
      unit: { type: 'string', example: 'pcs' }
    }
  },
  QuotationCreateRequest: {
    type: 'object',
    required: ['customform', 'entity', 'subsidiary', 'trandate', 'location', 'currency', 'items'],
    properties: {
      customform: { type: 'integer', example: 114 },
      title: { type: 'string', example: 'Judul Quotation edit dev' },
      entity: { type: 'integer', example: 1052, description: 'Customer ID' },
      subsidiary: { type: 'integer', example: 5 },
      trandate: { type: 'string', example: '20/3/2026' },
      memo: { type: 'string', example: 'Catatan Quotation' },
      otherrefnum: { type: 'string', example: 'PO-000001' },
      department: { type: 'integer', example: 101 },
      class: { type: 'integer', example: 3 },
      location: { type: 'integer', example: 19 },
      currency: { type: 'integer', example: 1 },
      duedate: { type: 'string', example: '30/3/2026' },
      probability: { type: 'integer', example: 80 },
      expectedclosedate: { type: 'string', example: '30/3/2026' },
      salesrep: { type: 'string', example: '' },
      opportunity: { type: 'string', example: '' },
      forecasttype: { type: 'integer', example: 1 },
      partner: { type: 'string', example: '' },
      custbody_msi_bank_payment_so: {
        type: 'array',
        items: { type: 'integer' },
        example: [3, 5]
      },
      custbody_cseg_cn_cfi: { type: 'integer', example: 4 },
      custbody_me_approval_status: { type: 'integer', example: 2 },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/QuotationLineItem' }
      }
    }
  },
  QuotationUpdateRequest: {
    type: 'object',
    required: ['id', 'customform', 'entity', 'subsidiary', 'trandate', 'location', 'currency', 'items'],
    properties: {
      id: { type: 'integer', example: 30658, description: 'Netsuite Internal ID or UUID string' },
      customform: { type: 'integer', example: 114 },
      title: { type: 'string', example: 'Judul Quotation edit dev' },
      entity: { type: 'integer', example: 1052, description: 'Customer ID' },
      subsidiary: { type: 'integer', example: 5 },
      trandate: { type: 'string', example: '20/3/2026' },
      memo: { type: 'string', example: 'Catatan Quotation' },
      otherrefnum: { type: 'string', example: 'PO-000001' },
      department: { type: 'integer', example: 101 },
      class: { type: 'integer', example: 3 },
      location: { type: 'integer', example: 19 },
      currency: { type: 'integer', example: 1 },
      duedate: { type: 'string', example: '30/3/2026' },
      probability: { type: 'integer', example: 80 },
      expectedclosedate: { type: 'string', example: '30/3/2026' },
      salesrep: { type: 'string', example: '' },
      opportunity: { type: 'string', example: '' },
      forecasttype: { type: 'integer', example: 1 },
      partner: { type: 'string', example: '' },
      custbody_msi_bank_payment_so: {
        type: 'array',
        items: { type: 'integer' },
        example: [3, 5]
      },
      custbody_cseg_cn_cfi: { type: 'integer', example: 4 },
      custbody_me_approval_status: { type: 'integer', example: 2 },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/QuotationLineItem' }
      }
    }
  }
};

module.exports = quotationSchema;
