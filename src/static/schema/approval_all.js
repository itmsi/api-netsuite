/**
 * Swagger Schema Definitions for Approval All Module
 */

const approvalAllSchemas = {
  ApprovalAllRequest: {
    type: 'object',
    required: ['id', 'recordType', 'actionId'],
    properties: {
      id: { type: 'integer', example: 53822, description: 'Internal ID record NetSuite' },
      recordType: { type: 'string', example: 'vendorpayment', description: 'Tipe record NetSuite (mis. vendorpayment, purchaseorder, vendorbill)' },
      note: { type: 'string', example: 'sumbit-test-hh-approved', description: 'Catatan approval' },
      noteTitle: { type: 'string', example: 'abdulharris@motorsights.net', description: 'Judul catatan (biasanya email approver)' },
      actionId: { type: 'string', example: 'approve', description: 'Aksi workflow yang dijalankan (mis. approve / reject)' },
      custbody_me_wf_next_approver_blank: { type: 'integer', example: 9, description: 'ID next approver pada workflow' }
    }
  },
  ApprovalAllResponse: {
    type: 'object',
    description: 'Response diteruskan apa adanya dari bridge API',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Approval berhasil diproses' },
      data: { type: 'object' }
    }
  }
};

module.exports = approvalAllSchemas;
