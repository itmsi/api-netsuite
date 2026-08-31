/**
 * Swagger Schema Definitions for Transfer Orders Module
 */

const transferOrderItemSchema = {
  type: "object",
  properties: {
    item: { type: "integer", example: 19592 },
    quantity: { type: "number", example: 2 },
    description: { type: "string", example: "Item desc" },
    department: { type: "integer", example: 104 },
    class: { type: "integer", example: 2 },
    rate: { type: "number", example: 50000 },
    amount: { type: "number", example: 100000 },
    expectedshipdate: { type: "string", example: "2/1/2024" },
    expectedreceiptdate: { type: "string", example: "2/5/2024" },
  },
};

const transferOrdersSchema = {
  TransferOrderFile: {
    type: "object",
    properties: {
      netsuiteId: { type: "string", example: "temp-001" },
      fileUrl: {
        type: "string",
        example: "https://cloud.inlinegroupdc.com/s/xR34c667kEKZRsj",
      },
      fileName: { type: "string", example: "Invoice Vendor" },
    },
  },
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
      from_location_id: {
        type: "integer",
        description: "Filter by from_location_id",
        example: 1,
      },
      to_location_id: {
        type: "integer",
        description: "Filter by to_location_id",
        example: 4,
      },
      start_date: {
        type: "string",
        description:
          "Filter tran_date mulai dari tanggal ini (inclusive), format YYYY-MM-DD",
        example: "2026-07-01",
      },
      end_date: {
        type: "string",
        description:
          "Filter tran_date sampai dengan tanggal ini (inclusive), format YYYY-MM-DD",
        example: "2026-07-31",
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
          firmed: { type: "boolean", example: true },
          useitemcostastransfercost: { type: "boolean", example: true },
          custbody_me_logistic_vendor: { type: "integer", example: 308 },
          custbody_me_inv_customer: { type: "integer", example: 1132 },
        },
      },
      files: {
        type: "array",
        items: { $ref: "#/components/schemas/TransferOrderFile" },
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
      transferlocation: { type: "integer", example: 2 },
      trandate: { type: "string", example: "31/12/2026" },
      memo: { type: "string", example: "Transfer order memo" },
      department: { type: "integer", example: 105 },
      class: { type: "integer", example: 5 },
      incoterm: { type: "integer", example: 1 },
      employee: { type: "integer", example: 1449 },
      firmed: { type: "boolean", example: true },
      useitemcostastransfercost: { type: "boolean", example: true },
      custbody_me_logistic_vendor: { type: "integer", example: 308 },
      custbody_me_inv_customer: { type: "integer", example: 1132 },
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
        items: { $ref: "#/components/schemas/TransferOrderFile" },
      },
    },
  },
  TransferOrderUpdateRequest: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "integer", example: 65352 },
      customform: { type: "integer", example: 135 },
      subsidiary: { type: "integer", example: 6 },
      location: { type: "integer", example: 1 },
      transferlocation: { type: "integer", example: 2 },
      trandate: { type: "string", example: "31/12/2026" },
      memo: { type: "string", example: "Transfer order memo di edit" },
      department: { type: "integer", example: 105 },
      class: { type: "integer", example: 5 },
      incoterm: { type: "integer", example: 1 },
      employee: { type: "integer", example: 1449 },
      firmed: { type: "boolean", example: true },
      useitemcostastransfercost: { type: "boolean", example: true },
      custbody_me_logistic_vendor: { type: "integer", example: 308 },
      custbody_me_inv_customer: { type: "integer", example: 1132 },
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
        items: { $ref: "#/components/schemas/TransferOrderFile" },
      },
    },
  },
  TransferOrderFileUploadRequest: {
    type: "object",
    properties: {
      file: {
        type: "string",
        format: "binary",
        description: "The file to upload",
      },
      file_name: {
        type: "string",
        description:
          "Optional custom file name. Will be normalized to lowercase with spaces replaced by underscores (_)",
      },
      netsuite_id: {
        type: "string",
        description:
          "Optional netsuite_id, netsuite_id sementara yg akan di buat oleh FE, prosesnya ketika add file akan insert file dan netsuite_id sementara, jangan sampe ui di refresh, jika di refresh maka akan generated netsuite_id baru di FE",
      },
    },
  },
  TransferOrderFileUploadResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      id: { type: "string", example: "f0b57258-5f33-4e03-81f7-cd70d833b5c5" },
      netsuiteId: { type: "string", example: "temp-001" },
      fileUrl: {
        type: "string",
        example: "https://cloud.inlinegroupdc.com/s/abcdefgh",
      },
      storagePath: { type: "string", example: "/temp/123456789_file.pdf" },
      fileName: { type: "string", example: "123456789_file.pdf" },
    },
  },
  TransferOrderFileFinalizeRequest: {
    type: "object",
    required: ["netsuite_id", "storage_path"],
    properties: {
      netsuite_id: { type: "string", example: "52362" },
      storage_path: { type: "string", example: "/temp/123456789_file.pdf" },
    },
  },
  TransferOrderFileFinalizeResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      path: {
        type: "string",
        example: "/uploads/to/2026/52362/123456789_file.pdf",
      },
    },
  },
  TransferOrderFileDeleteRequest: {
    type: "object",
    required: ["fileUrl"],
    properties: {
      fileUrl: {
        type: "string",
        example: "https://cloud.inlinegroupdc.com/s/abcdefgh",
      },
    },
  },
  TransferOrderFileUpdateRequest: {
    type: "object",
    required: ["fileUrl"],
    properties: {
      fileUrl: {
        type: "string",
        description: "The share URL of the existing file to update",
        example: "https://cloud.inlinegroupdc.com/s/abcdefgh",
      },
      file: {
        type: "string",
        format: "binary",
        description: "Optional new file to replace the existing file",
      },
      file_name: {
        type: "string",
        description:
          "Optional new filename. Will be normalized to lowercase with spaces replaced by underscores (_)",
      },
      netsuite_id: {
        type: "string",
        description:
          "Optional netsuite_id. If the file record does not exist for the provided fileUrl, this is used to create a new file record directly in the NetSuite Transfer Order folder.",
      },
    },
  },
  TransferOrderFileUpdateResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      message: { type: "string", example: "File updated successfully" },
      data: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "f0b57258-5f33-4e03-81f7-cd70d833b5c5",
          },
          netsuiteId: { type: "string", example: "52362" },
          fileUrl: {
            type: "string",
            example: "https://cloud.inlinegroupdc.com/s/abcdefgh",
          },
          storagePath: { type: "string", example: "/temp/123456789_file.pdf" },
          fileName: { type: "string", example: "file.pdf" },
        },
      },
    },
  },
};

module.exports = transferOrdersSchema;
