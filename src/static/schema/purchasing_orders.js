/**
 * Swagger Schema Definitions for Purchasing Orders Module
 */

const purchasingOrdersSchemas = {
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
      subsidiary_name: { type: 'string', example: 'PT Indonesia Equipment Centre' }
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
      lines: {
        type: 'array',
        items: { $ref: '#/components/schemas/PurchaseOrderLine' }
      }
    }
  },
  PurchaseOrderListRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      limit: { type: 'integer', default: 10, example: 10 },
      sort_by: { type: 'string', default: 'created_at', example: 'created_at' },
      sort_order: { type: 'string', default: 'desc', example: 'desc' },
      search: { type: 'string', default: '', example: '' }
    }
  }
};

module.exports = purchasingOrdersSchemas;
