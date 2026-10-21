/**
 * Swagger Schema Definitions for Vendor Prepayment Module
 */

const vendorPrepaymentSchema = {
  VendorPrepayment: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      netsuite_id: { type: 'string', example: '28015' },
      customform_id: { type: 'string', nullable: true, example: '123' },
      customform_name: { type: 'string', nullable: true, example: 'MSI Vendor Prepayment' },
      transactionnumber: { type: 'string', nullable: true, example: 'VPREP-00001' },
      tranid: { type: 'string', nullable: true, example: 'VPREP-00001' },
      tran_date: { type: 'string', nullable: true, example: '2026-06-07T17:00:00.000Z' },
      entity_id: { type: 'string', nullable: true, example: '1001' },
      entity_name: { type: 'string', nullable: true, example: 'PT Vendor Indonesia' },
      purchaseorder_id: { type: 'string', nullable: true, example: '5001' },
      purchaseorder_name: { type: 'string', nullable: true, example: 'PO-00001' },
      account_id: { type: 'string', nullable: true, example: '200' },
      account_name: { type: 'string', nullable: true, example: 'Bank Mandiri' },
      payment: { type: 'number', format: 'double', nullable: true, example: 1665000 },
      currency_id: { type: 'string', nullable: true, example: '1' },
      currency_name: { type: 'string', nullable: true, example: 'IDR' },
      exchangerate: { type: 'number', format: 'double', nullable: true, example: 1 },
      postingperiod_id: { type: 'string', nullable: true, example: '150' },
      postingperiod_name: { type: 'string', nullable: true, example: 'Jun 2026' },
      prepaymentaccount_id: { type: 'string', nullable: true, example: '300' },
      prepaymentaccount_name: { type: 'string', nullable: true, example: 'Uang Muka Pembelian' },
      tobeprinted: { type: 'boolean', nullable: true, example: false },
      printvoucher: { type: 'boolean', nullable: true, example: false },
      memo: { type: 'string', nullable: true, example: 'DP pembelian sparepart' },
      approval_status: { type: 'string', nullable: true, example: '2' },
      approval_status_name: { type: 'string', nullable: true, example: 'Approved' },
      wf_created_by_id: { type: 'string', nullable: true, example: '10' },
      wf_created_by_name: { type: 'string', nullable: true, example: 'John Doe' },
      delegate_approver_id: { type: 'string', nullable: true, example: null },
      delegate_approver_name: { type: 'string', nullable: true, example: null },
      in_delegation: { type: 'boolean', nullable: true, example: false },
      next_approver_blank: { type: 'string', nullable: true, example: '20' },
      next_approver_blank_name: { type: 'string', nullable: true, example: 'Jane Smith' },
      subsidiary_id: { type: 'string', nullable: true, example: '3' },
      subsidiary_name: { type: 'string', nullable: true, example: 'PT Motorsights Indonesia' },
      department_id: { type: 'string', nullable: true, example: '1' },
      department_name: { type: 'string', nullable: true, example: 'Purchasing' },
      class_id: { type: 'string', nullable: true, example: '2' },
      class_name: { type: 'string', nullable: true, example: 'Class A' },
      location_id: { type: 'string', nullable: true, example: '1' },
      location_name: { type: 'string', nullable: true, example: 'Jakarta' },
      cseg_cn_cfi_id: { type: 'string', nullable: true, example: null },
      cseg_cn_cfi_name: { type: 'string', nullable: true, example: null },
      applied_total: { type: 'number', format: 'double', nullable: true, example: 1665000 },
      last_modified_netsuite: { type: 'string', format: 'date-time', nullable: true, example: '2026-06-08T10:00:00Z' },
      is_deleted: { type: 'boolean', example: false },
      created_at: { type: 'string', format: 'date-time', example: '2026-06-08T10:00:00Z' },
      updated_at: { type: 'string', format: 'date-time', example: '2026-06-08T10:00:00Z' },
      created_by: { type: 'string', nullable: true, example: null },
      updated_by: { type: 'string', nullable: true, example: null },
      created_by_name: { type: 'string', nullable: true, example: null },
      update_by_name: { type: 'string', nullable: true, example: null }
    }
  },
  VendorPrepaymentDetail: {
    allOf: [
      { $ref: '#/components/schemas/VendorPrepayment' },
      {
        type: 'object',
        properties: {
          address: { type: 'string', nullable: true, example: 'Jl. Sudirman No. 1, Jakarta' },
          applied_to: {
            type: 'array',
            nullable: true,
            description: 'Daftar transaksi yang di-apply (jsonb)',
            items: { type: 'object' }
          },
          workflow_history: {
            type: 'array',
            nullable: true,
            description: 'Riwayat workflow approval (jsonb)',
            items: { type: 'object' }
          },
          user_notes: {
            type: 'array',
            nullable: true,
            description: 'User notes dari NetSuite (jsonb)',
            items: { type: 'object' }
          }
        }
      }
    ]
  },
  VendorPrepaymentListRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1, description: 'Nomor halaman' },
      page_size: { type: 'integer', example: 20, description: 'Jumlah data per halaman (alias: limit)' },
      sort_by: {
        type: 'string',
        enum: [
          'id', 'netsuite_id', 'tranid', 'transactionnumber', 'tran_date',
          'entity_name', 'purchaseorder_name', 'payment', 'applied_total',
          'approval_status', 'last_modified_netsuite', 'created_at', 'updated_at'
        ],
        example: 'tran_date'
      },
      sort_order: { type: 'string', enum: ['ASC', 'DESC'], example: 'DESC' },
      search: {
        type: 'string',
        example: 'VPREP',
        description: 'Cari di netsuite_id, tranid, transactionnumber, entity_name, purchaseorder_name, memo'
      },
      is_deleted: { type: 'boolean', default: false, example: false, description: 'Default false (hanya data yang belum dihapus)' },
      entity_id: { type: 'string', example: '1001' },
      purchaseorder_id: { type: 'string', example: '5001' },
      subsidiary_id: { type: 'string', example: '3' },
      approval_status: { type: 'string', example: '2' },
      department_id: { type: 'string', example: '1' },
      location_id: { type: 'string', example: '1' },
      currency_id: { type: 'string', example: '1' },
      class_id: { type: 'string', example: '2' },
      next_approver_blank: { type: 'string', example: '20' },
      current_approver_id: {
        type: 'string',
        nullable: true,
        example: '123',
        description: 'Wajib. Filter utama berdasarkan current approver di vendor_prepayment_workflow_history. Jika kosong / null, data tidak ditampilkan'
      },
      tran_date_from: { type: 'string', format: 'date', example: '2026-01-01' },
      tran_date_to: { type: 'string', format: 'date', example: '2026-12-31' }
    }
  },
  VendorPrepaymentAttachment: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      vendor_prepayment_netsuite_id: { type: 'string', example: '28015' },
      tran_id: { type: 'string', example: 'VPREP-00001' },
      count: { type: 'string', example: '2' },
      skipped_count: { type: 'string', example: '0' },
      status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'], example: 'SUCCESS' },
      file_netsuite_id: { type: 'string', example: '2913' },
      file_name: { type: 'string', example: 'invoice.pdf' },
      file_type: { type: 'string', example: 'PDF' },
      file_size: { type: 'string', example: '102400' },
      file_is_text: { type: 'boolean', example: false },
      file_skipped: { type: 'boolean', example: false },
      file_link: { type: 'string', nullable: true, example: 'vendor_prepayment/28015/2913_invoice.pdf' },
      created_at: { type: 'string', format: 'date-time' },
      created_by: { type: 'string', nullable: true },
      updated_at: { type: 'string', format: 'date-time', nullable: true },
      updated_by: { type: 'string', nullable: true },
      is_deleted: { type: 'boolean', example: false }
    }
  },
  VendorPrepaymentAttachmentListRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      page_size: { type: 'integer', example: 20, description: 'Jumlah data per halaman (alias: limit)' },
      sort_by: {
        type: 'string',
        example: 'created_at',
        enum: [
          'vendor_prepayment_netsuite_id', 'tran_id', 'status', 'file_netsuite_id',
          'file_name', 'file_type', 'created_at', 'updated_at'
        ]
      },
      sort_order: { type: 'string', enum: ['ASC', 'DESC'], example: 'DESC' },
      search: { type: 'string', description: 'Cari di file_name atau tran_id', example: '' },
      vendor_prepayment_netsuite_id: { type: 'string', example: '28015' },
      file_netsuite_id: { type: 'string', example: '' },
      status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'], example: 'SUCCESS' },
      is_deleted: { type: 'boolean', default: false, example: false }
    }
  },
  VendorPrepaymentAttachmentSyncRequest: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', description: 'NetSuite ID vendor prepayment', example: 28015 }
    }
  },
  VendorPrepaymentAttachmentConvertRequest: {
    type: 'object',
    required: ['file_netsuite_id'],
    properties: {
      file_netsuite_id: { type: 'string', description: 'NetSuite ID file attachment', example: '2913' }
    }
  }
};

module.exports = vendorPrepaymentSchema;
