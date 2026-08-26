/**
 * Swagger Schema Definitions for Transfer Orders Module
 */

const transferOrderItemSchema = {
  type: "object",
  properties: {
    item: { type: "integer", example: 19592 },
    quantity: { type: "number", example: 10 },
    description: { type: "string", example: "Item desc" },
    department: { type: "integer", example: 104 },
    class: { type: "integer", example: 2 },
    expectedshipdate: { type: "string", example: "2/1/2024" },
    expectedreceiptdate: { type: "string", example: "2/5/2024" },
  },
};

const transferOrderFileSchema = {
  type: "object",
  properties: {
    file_name: { type: "string", example: "document.pdf" },
    file_url: { type: "string", example: "https://example.com/document.pdf" },
  },
};

const transferOrdersSchema = {
  TransferOrderListRequest: {
    type: "object",
    properties: {
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 10 },
      sort_by: { type: "string", example: "created_at" },
      sort_order: { type: "string", example: "DESC" },
      search: {
        type: "string",
        description: "Cari di tranid, netsuite_id, atau memo",
        example: "Transfer order memo",
      },
      location: {
        type: "integer",
        description: "Filter by from_location_id",
        example: 1,
      },
      transferlocation: {
        type: "integer",
        description: "Filter by to_location_id",
        example: 4,
      },
      classes: { type: "string", default: "", example: "" },
      status_name: {
        type: "array",
        items: { type: "string" },
        example: [
          "Pending Approval",
          "Pending Fulfillment",
          "Pending Receipt",
          "Partially Fulfilled",
          "Received",
          "Pending Receipt/Partially Fulfilled",
        ],
      },
      status_code: {
        type: "array",
        items: { type: "string" },
        example: [
          "pendingApproval",
          "pendingFulfillment",
          "pendingReceipt",
          "partiallyFulfilled",
          "received",
          "pendingReceiptPartFulfilled",
        ],
      },
    },
  },
  TransferOrder: {
    type: "object",
    properties: {
      id: { type: "string", example: "f0b57258-5f33-4e03-81f7-cd70d833b5c5" },
      netsuite_id: { type: "string", nullable: true, example: "52362" },
      tranid: { type: "string", nullable: true, example: "TO-000123" },
      status_code: { type: "string", nullable: true, example: "A" },
      status_name: { type: "string", example: "pending" },
      from_location_id: { type: "integer", example: 1 },
      from_location_name: {
        type: "string",
        nullable: true,
        example: "Warehouse A",
      },
      to_location_id: { type: "integer", example: 4 },
      to_location_name: {
        type: "string",
        nullable: true,
        example: "Warehouse B",
      },
      memo: { type: "string", example: "Transfer order memo" },
      tran_date: { type: "string", example: "31/12/2026" },
      datecreated: {
        type: "string",
        nullable: true,
        example: "2026-08-24T07:44:27.781Z",
      },
      last_modified_netsuite: {
        type: "string",
        nullable: true,
        example: "2026-08-24T07:44:27.781Z",
      },
      items: {
        type: "array",
        items: transferOrderItemSchema,
      },
      data: {
        type: "object",
        description:
          "Field tambahan dari payload (customform, subsidiary, department, class, status, incoterm, employee)",
        properties: {
          customform: { type: "integer", example: 135 },
          subsidiary: { type: "integer", example: 6 },
          department: { type: "integer", example: 104 },
          class: { type: "integer", example: 2 },
          status: { type: "string", example: "A" },
          incoterm: { type: "integer", example: 1 },
          employee: { type: "integer", example: 7 },
        },
      },
      files: {
        type: "array",
        items: transferOrderFileSchema,
      },
      type_proccess: { type: "string", nullable: true, example: "CREATE" },
      status_proccess: {
        type: "string",
        nullable: true,
        example: "PROCESSING",
      },
      status_proccess_message: {
        type: "string",
        nullable: true,
        example: "Processing transfer order creation in NetSuite",
      },
      custbody_msi_createdby_api: {
        type: "string",
        example: "dharmaridwan@motorsights.net",
      },
      created_by_name: {
        type: "string",
        nullable: true,
        example: "dharma ridwan",
      },
      updated_by_name: {
        type: "string",
        nullable: true,
        example: "abdul harris",
      },
      created_at: { type: "string", example: "2026-08-24T07:44:27.781Z" },
      updated_at: {
        type: "string",
        nullable: true,
        example: "2026-08-24T07:44:27.781Z",
      },
    },
  },
  TransferOrderCreateRequest: {
    type: "object",
    required: [
      "subsidiary",
      "location",
      "transferlocation",
      "trandate",
      "items",
    ],
    properties: {
      customform: { type: "integer", example: 135 },
      subsidiary: { type: "integer", example: 6 },
      location: { type: "integer", example: 1 },
      transferlocation: { type: "integer", example: 4 },
      trandate: { type: "string", example: "31/12/2026" },
      memo: { type: "string", example: "Transfer order memo" },
      department: { type: "integer", example: 104 },
      class: { type: "integer", example: 2 },
      status: { type: "string", example: "A" },
      incoterm: { type: "integer", example: 1 },
      employee: { type: "integer", example: 7 },
      custbody_msi_createdby_api: {
        type: "string",
        example: "dharmaridwan@motorsights.net",
      },
      items: {
        type: "array",
        items: transferOrderItemSchema,
      },
      files: {
        type: "array",
        items: transferOrderFileSchema,
      },
    },
  },
  TransferOrderUpdateRequest: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "integer", example: 64745 },
      customform: { type: "integer", example: 135 },
      subsidiary: { type: "integer", example: 6 },
      location: { type: "integer", example: 1 },
      transferlocation: { type: "integer", example: 4 },
      trandate: { type: "string", example: "31/12/2026" },
      memo: { type: "string", example: "Transfer order memo edit dua kali" },
      department: { type: "integer", example: 104 },
      class: { type: "integer", example: 2 },
      status: { type: "string", example: "A" },
      incoterm: { type: "integer", example: 1 },
      employee: { type: "integer", example: 7 },
      custbody_msi_createdby_api: {
        type: "string",
        example: "dharmaridwan@motorsights.net",
      },
      items: {
        type: "array",
        items: transferOrderItemSchema,
      },
      files: {
        type: "array",
        items: transferOrderFileSchema,
      },
    },
  },
};

module.exports = transferOrdersSchema;
