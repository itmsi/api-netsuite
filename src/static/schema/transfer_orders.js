/**
 * Swagger Schema Definitions for Transfer Orders Module
 */

const transferOrderItemSchema = {
  type: 'object',
  properties: {
    item: { type: 'integer', example: 19592 },
    quantity: { type: 'number', example: 10 },
    description: { type: 'string', example: 'Item desc' },
    department: { type: 'integer', example: 104 },
    class: { type: 'integer', example: 2 },
    expectedshipdate: { type: 'string', example: '2/1/2024' },
    expectedreceiptdate: { type: 'string', example: '2/5/2024' }
  }
};

const transferOrderFileSchema = {
  type: 'object',
  properties: {
    file_name: { type: 'string', example: 'document.pdf' },
    file_url: { type: 'string', example: 'https://example.com/document.pdf' }
  }
};

const transferOrdersSchema = {
  TransferOrderListRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 10 },
      sort_by: { type: 'string', example: 'created_at' },
      sort_order: { type: 'string', example: 'DESC' },
      search: { type: 'string', example: 'Transfer order memo' },
      subsidiary: { type: 'integer', example: 6 },
      location: { type: 'integer', example: 1 },
      transferlocation: { type: 'integer', example: 4 },
      to_status: { type: 'string', example: 'pending' }
    }
  },
  TransferOrder: {
    type: 'object',
    properties: {
      id: { type: 'string', example: 'f0b57258-5f33-4e03-81f7-cd70d833b5c5' },
      to_id: { type: 'string', nullable: true, example: '52362' },
      to_status: { type: 'string', example: 'pending' },
      customform: { type: 'integer', example: 135 },
      subsidiary: { type: 'integer', example: 6 },
      subsidiary_display: { type: 'string', example: 'IEC' },
      location: { type: 'integer', example: 1 },
      location_display: { type: 'string', example: 'Warehouse A' },
      transferlocation: { type: 'integer', example: 4 },
      transferlocation_display: { type: 'string', example: 'Warehouse B' },
      trandate: { type: 'string', example: '31/12/2026' },
      memo: { type: 'string', example: 'Transfer order memo' },
      department: { type: 'integer', example: 104 },
      department_display: { type: 'string', example: 'Logistics' },
      class: { type: 'integer', example: 2 },
      class_display: { type: 'string', example: 'Trading' },
      status: { type: 'string', example: 'A' },
      incoterm: { type: 'integer', example: 1 },
      employee: { type: 'integer', example: 7 },
      custbody_msi_createdby_api: { type: 'string', example: 'dharmaridwan@motorsights.net' },
      lines: {
        type: 'array',
        items: transferOrderItemSchema
      },
      files: {
        type: 'array',
        items: transferOrderFileSchema
      },
      created_at: { type: 'string', example: '2026-08-24T07:44:27.781Z' },
      updated_at: { type: 'string', nullable: true, example: '2026-08-24T07:44:27.781Z' }
    }
  },
  TransferOrderCreateRequest: {
    type: 'object',
    required: ['subsidiary', 'location', 'transferlocation', 'trandate', 'items'],
    properties: {
      customform: { type: 'integer', example: 135 },
      subsidiary: { type: 'integer', example: 6 },
      location: { type: 'integer', example: 1 },
      transferlocation: { type: 'integer', example: 4 },
      trandate: { type: 'string', example: '31/12/2026' },
      memo: { type: 'string', example: 'Transfer order memo' },
      department: { type: 'integer', example: 104 },
      class: { type: 'integer', example: 2 },
      status: { type: 'string', example: 'A' },
      incoterm: { type: 'integer', example: 1 },
      employee: { type: 'integer', example: 7 },
      custbody_msi_createdby_api: { type: 'string', example: 'dharmaridwan@motorsights.net' },
      items: {
        type: 'array',
        items: transferOrderItemSchema
      },
      files: {
        type: 'array',
        items: transferOrderFileSchema
      }
    }
  },
  TransferOrderUpdateRequest: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', example: 64745 },
      customform: { type: 'integer', example: 135 },
      subsidiary: { type: 'integer', example: 6 },
      location: { type: 'integer', example: 1 },
      transferlocation: { type: 'integer', example: 4 },
      trandate: { type: 'string', example: '31/12/2026' },
      memo: { type: 'string', example: 'Transfer order memo edit dua kali' },
      department: { type: 'integer', example: 104 },
      class: { type: 'integer', example: 2 },
      status: { type: 'string', example: 'A' },
      incoterm: { type: 'integer', example: 1 },
      employee: { type: 'integer', example: 7 },
      custbody_msi_createdby_api: { type: 'string', example: 'dharmaridwan@motorsights.net' },
      items: {
        type: 'array',
        items: transferOrderItemSchema
      },
      files: {
        type: 'array',
        items: transferOrderFileSchema
      }
    }
  }
};

module.exports = transferOrdersSchema;
