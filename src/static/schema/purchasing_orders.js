/**
 * Swagger Schema Definitions for Purchasing Orders Module
 */

const purchasingOrdersSchemas = {
  PurchaseOrderFile: {
    type: 'object',
    properties: {
      poId: { type: 'string', example: 'temp-001' },
      fileUrl: { type: 'string', example: 'https://cloud.inlinegroupdc.com/s/xR34c667kEKZRsj' },
      fileName: { type: 'string', example: 'Invoice Vendor' }
    }
  },
  PurchaseOrderLine: {
    type: 'object',
    properties: {
      po_id: { type: 'integer', example: 4872 },
      item_id: { type: 'integer', example: 26589 },
      quantity: { type: 'number', example: 10 },
      item_name: { type: 'string', example: '102096921 - BRACKET APAR 6 KG' },
      line_memo: { type: 'string', nullable: true, example: null },
      unit_price: { type: 'number', example: 50000 },
      line_number: { type: 'integer', example: 1 },
      location_id: { type: 'integer', example: 19 },
      department_id: { type: 'integer', example: 101 },
      location_name: { type: 'string', example: 'Jakarta - IEC' },
      subsidiary_id: { type: 'integer', example: 5 },
      department_name: { type: 'string', example: 'Indirect Purchasing' },
      subsidiary_name: { type: 'string', example: 'PT Indonesia Equipment Centre' },
      amount: { type: 'number', example: 100000 },
      tax_amount: { type: 'number', example: 11000 }
    }
  },
  PurchaseOrder: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 46 },
      po_id: { type: 'string', example: '4872' },
      po_number: { type: 'string', example: 'PO-IEC-2026-000155' },
      po_date: { type: 'string', format: 'date-time', example: '2026-03-25T00:00:00+07:00' },
      po_status: { type: 'string', example: 'A' },
      po_status_label: { type: 'string', example: 'Purchase Order : Pending Supervisor Approval' },
      memo: { type: 'string', nullable: true, example: 'update next' },
      vendor_id: { type: 'integer', example: 246 },
      vendor_name: { type: 'string', example: 'BAP - PT BALINA AGUNG PERKASA' },
      currency_id: { type: 'integer', example: 1 },
      currency_symbol: { type: 'string', example: 'IDR' },
      created_at: { type: 'string', format: 'date-time', example: '2026-03-26T09:19:30.528Z' },
      updated_at: { type: 'string', format: 'date-time', example: '2026-03-26T09:48:21.451Z' },
      last_modified: { type: 'string', format: 'date-time', example: '2026-03-26T00:00:00+07:00' },
      pr_number: { type: 'string', nullable: true, example: null },
      raw_request: { type: 'string', nullable: true, example: null },
      raw_response: { type: 'string', nullable: true, example: null },
      foreigntotal: { type: 'number', example: -980000 },
      total: { type: 'number', example: -980000 },
      message_error: {
        type: 'object',
        nullable: true,
        description: 'Detail pesan error dari outbox_events jika status failed',
        example: { response: { error: { message: 'Invalid scriptlet ID', code: 'SSS_INVALID_SCRIPTLET_ID' } } }
      },
      sum_quantity: { type: 'number', example: 3 },
      count_items: { type: 'integer', example: 3 },
      subtotal: { type: 'number', example: 300000 },
      total_tax: { type: 'number', example: 33000 },
      files: {
        type: 'array',
        items: { $ref: '#/components/schemas/PurchaseOrderFile' }
      }
    }
  },
  PurchaseOrderDashboardItem: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'df49c5c7-f6e9-407b-8813-155d271b4820' },
      po_id: { type: 'string', example: '19964' },
      subsidiary_display: { type: 'string', example: 'PT Indonesia Equipment Centre' },
      po_number: { type: 'string', example: 'PO-IEC-2026-000120' },
      po_date: { type: 'string', example: '3/6/2026' },
      approvalstatus: { type: 'integer', example: 1 },
      approvalstatus_display: { type: 'string', example: 'Pending Approval' },
      nextapprover: { type: 'string', example: 'MSIJKT2311139 - Oscar Feriady Hadi Saputra' },
      po_status: { type: 'string', example: 'pendingSupApproval' },
      po_status_label: { type: 'string', example: 'Pending Supervisor Approval' }
    }
  },
  PurchaseOrderListRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      limit: { type: 'integer', default: 10, example: 10 },
      sort_by: { type: 'string', default: 'created_at', example: 'created_at' },
      sort_order: { type: 'string', default: 'desc', example: 'desc' },
      search: { type: 'string', default: '', example: '' },
      classes: { type: 'string', default: '', example: '' },
      subsidiary: { type: 'string', default: '', example: '' },
      location: { type: 'string', default: '', example: '' },
      po_status: { type: 'string', default: '', example: '' },
      approvalstatus: { type: 'string', default: '', example: '' },
      created_by: { type: 'string', default: '', example: '', nullable: true }
    }
  },
  PurchaseOrderLineItem: {
    type: 'object',
    required: ['itemId', 'qty', 'rate'],
    properties: {
      itemId: { type: 'integer', example: 26589 },
      qty: { type: 'number', example: 10 },
      rate: { type: 'number', example: 50000 },
      department: { type: 'integer', example: 101 },
      class: { type: 'integer', example: 3 },
      location: { type: 'integer', example: 19 },
      taxcode: { type: 'integer', example: 18098 },
      custcol_msi_fob: { type: 'number', example: 5000 },
      custcol_me_landed_cost: { type: 'number', example: 5000 },
      description: { type: 'string', example: 'Description' }
    }
  },
  PurchaseOrderCreateRequest: {
    type: 'object',
    required: ['customform', 'vendorid', 'purchasedate', 'subsidiary', 'location', 'currency', 'items'],
    properties: {
      customform: { type: 'integer', example: 102 },
      vendorid: { type: 'integer', example: 246 },
      purchasedate: { type: 'string', example: '25/03/2026' },
      subsidiary: { type: 'integer', example: 5 },
      location: { type: 'integer', example: 19 },
      memo: { type: 'string', example: 'PO from API - 26 Note Approved' },
      currency: { type: 'integer', example: 1 },
      terms: { type: 'integer', example: 9 },
      custbody_me_pr_date: { type: 'string', example: '24/03/2026' },
      custbody_me_project_location: { type: 'integer', example: 1 },
      custbody_me_pr_type: { type: 'integer', example: 1 },
      custbody_me_saving_type: { type: 'integer', example: 1 },
      custbody_me_pr_number: { type: 'string', example: 'PR-001' },
      custbody_msi_createdby_api: { type: 'string', example: 'dharmaridwan@motorsights.net' },
      class: { type: 'integer', example: 3 },
      custbody_me_validity_date: { type: 'string', example: '24/03/2026' },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/PurchaseOrderLineItem' }
      },
      files: {
        type: 'array',
        items: { $ref: '#/components/schemas/PurchaseOrderFile' }
      }
    }
  },
  PurchaseOrderUpdateRequest: {
    type: 'object',
    required: ['id', 'customform', 'vendorid', 'purchasedate', 'subsidiary', 'location', 'currency', 'items'],
    properties: {
      id: { type: 'integer', example: 4978 },
      customform: { type: 'integer', example: 102 },
      vendorid: { type: 'integer', example: 246 },
      purchasedate: { type: 'string', example: '25/03/2026' },
      subsidiary: { type: 'integer', example: 5 },
      location: { type: 'integer', example: 19 },
      memo: { type: 'string', example: 'PO from API - 26 Note Approved di edit lg ya' },
      currency: { type: 'integer', example: 1 },
      terms: { type: 'integer', example: 9 },
      custbody_me_pr_date: { type: 'string', example: '24/03/2026' },
      custbody_me_project_location: { type: 'integer', example: 1 },
      custbody_me_pr_type: { type: 'integer', example: 1 },
      custbody_me_saving_type: { type: 'integer', example: 1 },
      custbody_me_pr_number: { type: 'string', example: 'PR-001' },
      custbody_msi_createdby_api: { type: 'string', example: 'dharmaridwan@motorsights.net', description: 'Auto-populated from token if not provided' },
      class: { type: 'integer', example: 3 },
      department: { type: 'integer', example: 101 },
      custbody_me_validity_date: { type: 'string', example: '24/03/2026' },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/PurchaseOrderLineItem' }
      },
      files: {
        type: 'array',
        items: { $ref: '#/components/schemas/PurchaseOrderFile' }
      }
    }
  },
  PurchaseOrderApprovalRequest: {
    type: 'object',
    required: ['id', 'recordType'],
    properties: {
      id: { type: 'integer', example: 7112 },
      recordType: { type: 'string', example: 'purchaseorder' },
      custbody_msi_submit_app_api: { type: 'boolean', example: false },
      custbody_msi_reopen_api: { type: 'boolean', example: true },
      custbody_msi_resubmit_api: { type: 'boolean', example: false },
      note: { type: 'string', example: 'ini process resubmit' },
      noteTitle: { type: 'string', example: 'dharmaridwan@motorsights.net' }
    }
  },
  PurchaseOrderApprovalResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Note created first, record updated & workflow triggered' },
      data: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 7112 },
          noteId: { type: 'integer', example: 3312 }
        }
      }
    }
  },
  PurchaseOrderDetailResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: '' },
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/PurchaseOrder' }
      },
      timestamp: { type: 'string', format: 'date-time', example: '2026-04-01T06:26:20.856Z' }
    }
  },
  ReceiveListRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      limit: { type: 'integer', default: 10, example: 10 },
      sort_by: { type: 'string', default: 'created_at', example: 'created_at' },
      sort_order: { type: 'string', default: 'desc', example: 'desc' },
      search: { type: 'string', default: '', example: '', description: 'Filter untuk tranid, vendor_name, subsidiary_display, location_display' },
      classes: { type: 'string', default: '', example: '', description: 'Filter untuk kolom class' },
      subsidiary: { type: 'string', default: '', example: '', description: 'Filter untuk kolom subsidiary' },
      location: { type: 'string', default: '', example: '', description: 'Filter untuk kolom location' },
      vendor_id: { type: 'string', default: '', example: '', description: 'Filter untuk kolom vendor_id' },
      receipt_ids: { type: 'array', items: { type: 'string' }, example: ['10361'], description: 'Filter untuk list receipt ID' },
      tranid: { type: 'string', default: '', example: '', description: 'Filter untuk kolom tranid' },
      createdfrom_text: { type: 'string', default: '', example: 'PO-', description: 'Filter untuk kolom createdfrom_text' },
      createdfrom: { type: 'integer', default: 5512, example: 5512, description: 'Filter untuk kolom createdfrom' }
    }
  }
};

module.exports = purchasingOrdersSchemas;
