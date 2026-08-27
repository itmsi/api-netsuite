/**
 * Swagger Schema Definitions for Items Module
 */

const itemsSchemas = {
  ItemsRequest: {
    type: "object",
    properties: {
      page: { type: "integer", default: 1, example: 1 },
      limit: { type: "integer", default: 10, example: 10 },
      sort_by: { type: "string", default: "created_at", example: "created_at" },
      sort_order: { type: "string", default: "desc", example: "desc" },
      search: { type: "string", default: "", example: "" },
      lastmodified: {
        type: "string",
        nullable: true,
        example: "2026-03-18T08:56:00+07:00",
      },
      netsuite_id: { type: "string", nullable: true, example: null },
      item_type: {
        oneOf: [
          { type: "string" },
          { type: "array", items: { type: "string" } },
        ],
        nullable: true,
        example: ["Non-inventory Item", "Inventory Item"],
      },
      item_type_id: {
        oneOf: [
          { type: "string" },
          { type: "array", items: { type: "string" } },
        ],
        nullable: true,
        example: ["InvtPart", "NonInvtPart"],
      },
    },
  },
  ItemsListResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { type: "object", description: "Item data from bridge API" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      message: { type: "string", example: "Data items berhasil diambil" },
    },
  },
  ItemSyncByIdResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: {
        type: "object",
        description:
          "Item hasil query ulang dari database lokal (bridge_sanbox.items) setelah sync berhasil, format sama dengan item pada `/get-list`",
        properties: {
          internalId: { type: "string", example: "7337" },
          itemId: { type: "string", example: "ITM-001" },
          itemType: { type: "string", example: "Inventory Item" },
          displayName: { type: "string", example: "Item Display Name" },
          lastModifiedDate: {
            type: "string",
            nullable: true,
            example: "2026-03-18T08:56:00+07:00",
          },
          locations: {
            type: "array",
            items: { type: "object" },
          },
        },
      },
      message: {
        type: "string",
        example: "Item ID 7337 berhasil di-sync dari bridge API",
      },
    },
  },
  ReceiptsRequest: {
    type: "object",
    properties: {
      page: { type: "integer", default: 1, example: 1 },
      limit: { type: "integer", default: 20, example: 20 },
      sort_by: {
        type: "string",
        default: "last_modified_netsuite",
        example: "last_modified_netsuite",
      },
      sort_order: { type: "string", default: "desc", example: "desc" },
      search: { type: "string", default: "", example: "PO123" },
      status: { type: "string", nullable: true, example: "success" },
      vendor_id: { type: "string", nullable: true, example: "12345" },
      location: { type: "string", nullable: true, example: "10" },
      classes: { type: "string", nullable: true, example: "2" },
      source_type: {
        type: "string",
        nullable: true,
        example: "purchase_order",
      },
    },
  },
  ReceiptsListResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                netsuite_id: { type: "string", example: "588" },
                tranid: { type: "string", example: "RCPT-001" },
                trandate: { type: "string", example: "2026-03-18" },
                status: { type: "string", example: "success" },
                status_display: { type: "string", example: "Success" },
                memo: {
                  type: "string",
                  nullable: true,
                  example: "Goods receipt",
                },
                vendor_id: { type: "string", nullable: true, example: "123" },
                vendor_name: {
                  type: "string",
                  nullable: true,
                  example: "Vendor ABC",
                },
                createdfrom: {
                  type: "string",
                  nullable: true,
                  example: "PO-123",
                },
                createdfrom_display: {
                  type: "string",
                  nullable: true,
                  example: "Purchase Order 123",
                },
                subsidiary: { type: "string", nullable: true, example: "1" },
                subsidiary_display: {
                  type: "string",
                  nullable: true,
                  example: "Subsidiary 1",
                },
                location: { type: "string", nullable: true, example: "10" },
                location_display: {
                  type: "string",
                  nullable: true,
                  example: "Warehouse A",
                },
                department: { type: "string", nullable: true, example: "5" },
                department_display: {
                  type: "string",
                  nullable: true,
                  example: "Purchasing",
                },
                class: { type: "string", nullable: true, example: "2" },
                class_display: {
                  type: "string",
                  nullable: true,
                  example: "Accessories",
                },
                last_modified_netsuite: {
                  type: "string",
                  nullable: true,
                  example: "2026-03-18T08:56:00+07:00",
                },
                datecreated_netsuite: {
                  type: "string",
                  nullable: true,
                  example: "2026-03-18T08:00:00+07:00",
                },
                created_at: {
                  type: "string",
                  example: "2026-03-18T08:56:00+07:00",
                },
                created_by_name: {
                  type: "string",
                  nullable: true,
                  example: "Admin",
                },
                updated_at: {
                  type: "string",
                  nullable: true,
                  example: "2026-03-18T09:00:00+07:00",
                },
                lines: {
                  type: "string",
                  nullable: true,
                  example: '[{"item":"A","qty":2}]',
                },
              },
            },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      message: { type: "string", example: "Data receipts berhasil diambil" },
    },
  },
  ReceiptDetailResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          netsuite_id: { type: "string", example: "588" },
          tranid: { type: "string", example: "RCPT-001" },
          trandate: { type: "string", example: "2026-03-18" },
          status: { type: "string", example: "success" },
          status_display: { type: "string", example: "Success" },
          memo: { type: "string", nullable: true, example: "Goods receipt" },
          vendor_id: { type: "string", nullable: true, example: "123" },
          vendor_name: {
            type: "string",
            nullable: true,
            example: "Vendor ABC",
          },
          createdfrom: { type: "string", nullable: true, example: "PO-123" },
          createdfrom_display: {
            type: "string",
            nullable: true,
            example: "Purchase Order 123",
          },
          subsidiary: { type: "string", nullable: true, example: "1" },
          subsidiary_display: {
            type: "string",
            nullable: true,
            example: "Subsidiary 1",
          },
          location: { type: "string", nullable: true, example: "10" },
          location_display: {
            type: "string",
            nullable: true,
            example: "Warehouse A",
          },
          department: { type: "string", nullable: true, example: "5" },
          department_display: {
            type: "string",
            nullable: true,
            example: "Purchasing",
          },
          class: { type: "string", nullable: true, example: "2" },
          class_display: {
            type: "string",
            nullable: true,
            example: "Accessories",
          },
          last_modified_netsuite: {
            type: "string",
            nullable: true,
            example: "2026-03-18T08:56:00+07:00",
          },
          datecreated_netsuite: {
            type: "string",
            nullable: true,
            example: "2026-03-18T08:00:00+07:00",
          },
          created_at: {
            type: "string",
            example: "2026-03-18T08:56:00+07:00",
          },
          created_by_name: {
            type: "string",
            nullable: true,
            example: "Admin",
          },
          updated_at: {
            type: "string",
            nullable: true,
            example: "2026-03-18T09:00:00+07:00",
          },
          lines: {
            type: "array",
            nullable: true,
            items: { type: "object" },
            example: [{ item: "A", qty: 2 }],
          },
        },
      },
      message: { type: "string", example: "Data receipt berhasil diambil" },
    },
  },
  CreateFulfillmentReceiptsRequest: {
    type: "object",
    required: ["function_type", "transaction_type", "transaction_id", "items"],
    properties: {
      function_type: {
        type: "string",
        enum: ["receipts", "fulfillment"],
        example: "receipts",
        description:
          "Menentukan proses yang dijalankan: item receipt atau item fulfillment",
      },
      transaction_type: {
        type: "string",
        enum: [
          "sales_order",
          "transfer_order",
          "vendor_return",
          "purchase_order",
          "customer_return",
        ],
        example: "purchase_order",
      },
      transaction_id: {
        type: "string",
        description: "Netsuite ID dari transaksi terkait",
        example: "46555",
      },
      items: {
        type: "string",
        description: "JSON string array of { line, quantity }",
        example: '[{"line":1,"quantity":1}]',
      },
      file: {
        type: "string",
        format: "binary",
        description: "Lampiran file (opsional, single file)",
      },
      note: {
        type: "string",
        description:
          "identifikasi proses ini di jalanan dari apps MSI atau dari WMS ITI",
        example: "created by login email (apps)",
      },
      note_title: {
        type: "string",
        description:
          "identifikasi proses ini di jalanan dari email login apps (dari apps),  WMS (dari ITI)",
        example: "dharmaridwan@motorsights.net",
      },
    },
  },
  CreateFulfillmentReceiptsResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: {
        type: "object",
        properties: {
          function_type: { type: "string", example: "receipts" },
          transaction_type: { type: "string", example: "purchase_order" },
          transaction_id: { type: "string", example: "46555" },
          file: {
            type: "object",
            nullable: true,
            properties: {
              fileName: { type: "string", example: "invoice.pdf" },
              fileUrl: {
                type: "string",
                example: "https://cloud.inlinegroupdc.com/s/xxxx",
              },
            },
          },
        },
      },
      message: { type: "string", example: "Item receipt sedang diproses" },
    },
  },
};

module.exports = itemsSchemas;
