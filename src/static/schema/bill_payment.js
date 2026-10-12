/**
 * Swagger Schema Definitions for Bill Payment Module
 */

const billPaymentSchema = {
  BillPayment: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      netsuite_id: { type: 'integer', example: 12345 },
      transactionnumber: { type: 'string', example: 'BP-00001' },
      tranid: { type: 'string', example: 'BP-00001' },
      entity_display: { type: 'string', example: 'PT Supplier Indonesia' },
      account_display: { type: 'string', example: 'Cash - MANDIRI' },
      currency_display: { type: 'string', example: 'Indonesia Rupiah' },
      postingperiod_display: { type: 'string', example: 'Jan 2024' },
      custbody_me_wf_created_by_display: { type: 'string', example: 'John Doe' },
      approvalstatus_display: { type: 'string', example: 'Approved' },
      subsidiary_display: { type: 'string', example: 'PT Motorsights Indonesia' },
      class_display: { type: 'string', example: 'Class A' },
      department_display: { type: 'string', example: 'Finance' },
      location_display: { type: 'string', example: 'Jakarta' },
      custbody_cseg_cn_cfi_display: { type: 'string', example: 'CFI-001' },
      entity: { type: 'integer', example: 100 },
      account: { type: 'integer', example: 200 },
      currency: { type: 'integer', example: 1 },
      postingperiod: { type: 'integer', example: 202401 },
      custbody_me_wf_created_by: { type: 'integer', example: 5 },
      approvalstatus: { type: 'integer', example: 2 },
      subsidiary: { type: 'integer', example: 1 },
      class: { type: 'integer', example: 3 },
      department: { type: 'integer', example: 4 },
      location: { type: 'integer', example: 2 },
      custbody_cseg_cn_cfi: { type: 'integer', example: 10 },
      total: { type: 'number', format: 'double', example: 5000000.00 },
      exchangerate: { type: 'number', format: 'float', example: 1.0 },
      trandate: { type: 'string', format: 'date-time', example: '2024-01-15T00:00:00Z' },
      last_modified_netsuite: { type: 'string', format: 'date-time', example: '2024-01-15T10:00:00Z' },
      applied_to: { type: 'object', nullable: true, example: null },
      credit_applied: { type: 'object', nullable: true, example: null },
      workflow_history: { type: 'object', nullable: true, example: null },
      user_notes: { type: 'object', nullable: true, example: null },
      created_at: { type: 'string', format: 'date-time', example: '2024-01-15T10:00:00Z' },
      updated_at: { type: 'string', format: 'date-time', example: '2024-01-15T10:00:00Z' },
      is_deleted: { type: 'boolean', example: false }
    }
  },
  BillPaymentListRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 10 },
      sort_by: {
        type: 'string',
        example: 'last_modified_netsuite',
        enum: [
          'id', 'netsuite_id', 'transactionnumber', 'tranid',
          'entity', 'entity_display', 'account', 'account_display',
          'currency', 'currency_display', 'postingperiod', 'postingperiod_display',
          'approvalstatus', 'approvalstatus_display', 'subsidiary', 'subsidiary_display',
          'class', 'class_display', 'department', 'department_display',
          'location', 'location_display', 'total', 'exchangerate',
          'trandate', 'last_modified_netsuite', 'created_at', 'updated_at'
        ]
      },
      sort_order: { type: 'string', enum: ['asc', 'desc'], example: 'desc' },
      search: { type: 'string', description: 'Search by tranid, transactionnumber, entity_display, atau account_display', example: '' },
      is_deleted: { type: 'boolean', example: false },
      entity: { type: 'integer', example: 100 },
      currency: { type: 'integer', example: 1 },
      subsidiary: { type: 'integer', example: 1 },
      approvalstatus: { type: 'integer', example: 2 },
      department: { type: 'integer', example: 4 },
      location: { type: 'integer', example: 2 },
      trandate_from: { type: 'string', format: 'date', example: '2024-01-01' },
      trandate_to: { type: 'string', format: 'date', example: '2024-12-31' },
      current_approver_id: { type: 'string', nullable: true, example: '123' }
    }
  },
  BillPaymentAttachment: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      bill_payment_netsuite_id: { type: 'string', example: '100421' },
      tran_id: { type: 'string', example: 'BP-00001' },
      count: { type: 'string', example: '2' },
      skipped_count: { type: 'string', example: '0' },
      status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'], example: 'SUCCESS' },
      file_netsuite_id: { type: 'string', example: '2913' },
      file_name: { type: 'string', example: 'invoice.pdf' },
      file_type: { type: 'string', example: 'PDF' },
      file_size: { type: 'string', example: '102400' },
      file_is_text: { type: 'boolean', example: false },
      file_skipped: { type: 'boolean', example: false },
      file_link: { type: 'string', nullable: true, example: 'bills_payment/100421/2913_invoice.pdf' },
      download_url: { type: 'string', nullable: true, description: 'Link download file, wajib pakai Bearer token (null jika status belum SUCCESS)', example: 'http://localhost:9581/api/netsuite/bill-payment/attachments-files/download/2913' },
      created_at: { type: 'string', format: 'date-time' },
      created_by: { type: 'string', nullable: true },
      updated_at: { type: 'string', format: 'date-time', nullable: true },
      updated_by: { type: 'string', nullable: true },
      is_deleted: { type: 'boolean', example: false }
    }
  },
  BillPaymentAttachmentListRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      sort_by: {
        type: 'string',
        example: 'created_at',
        enum: ['bill_payment_netsuite_id', 'tran_id', 'status', 'file_netsuite_id', 'file_name', 'file_type', 'created_at', 'updated_at']
      },
      sort_order: { type: 'string', enum: ['asc', 'desc'], example: 'desc' },
      search: { type: 'string', description: 'Search by file_name atau tran_id', example: '' },
      bill_payment_netsuite_id: { type: 'string', example: '100421' },
      file_netsuite_id: { type: 'string', example: '' },
      status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'], example: 'SUCCESS' },
      is_deleted: { type: 'boolean', example: false }
    }
  },
  BillPaymentAttachmentSyncRequest: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', description: 'NetSuite ID bill payment', example: 100421 }
    }
  },
  BillPaymentAttachmentConvertRequest: {
    type: 'object',
    required: ['file_netsuite_id'],
    properties: {
      file_netsuite_id: { type: 'string', description: 'NetSuite ID file attachment', example: '2913' }
    }
  }
};

module.exports = billPaymentSchema;
