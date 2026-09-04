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
  FulfillmentsRequest: {
    type: "object",
    properties: {
      page: { type: "integer", default: 1, example: 1 },
      limit: { type: "integer", default: 20, example: 20 },
      sort_by: {
        type: "string",
        default: "last_modified",
        example: "last_modified",
      },
      sort_order: { type: "string", default: "desc", example: "desc" },
      search: { type: "string", default: "", example: "FUL123" },
      status: { type: "string", nullable: true, example: "shipped" },
      entity_id: { type: "string", nullable: true, example: "12345" },
      location: { type: "string", nullable: true, example: "10" },
      classes: { type: "string", nullable: true, example: "2" },
    },
  },
  FulfillmentItem: {
    type: "object",
    properties: {
      id: { type: "integer", example: 1 },
      netsuite_id: { type: "string", example: "588" },
      number: { type: "string", example: "IF-001" },
      date: { type: "string", nullable: true, example: "2026-03-18" },
      status: { type: "string", example: "shipped" },
      status_label: { type: "string", example: "Shipped" },
      memo: { type: "string", nullable: true, example: "Item fulfillment" },
      entity_id: { type: "string", nullable: true, example: "123" },
      entity_name: { type: "string", nullable: true, example: "Customer ABC" },
      createdfrom_id: { type: "string", nullable: true, example: "46555" },
      createdfrom_number: {
        type: "string",
        nullable: true,
        example: "SO-123",
      },
      postingperiod: { type: "string", nullable: true, example: "Mar 2026" },
      last_modified: {
        type: "string",
        nullable: true,
        example: "2026-03-18T08:56:00+07:00",
      },
      created_by_netsuite: {
        type: "string",
        nullable: true,
        example: "Admin",
      },
      custbody_me_wf_created_by: {
        type: "string",
        nullable: true,
        example: "Admin",
      },
      custbody_me_approval_status: {
        type: "string",
        nullable: true,
        example: "2",
      },
      custbody_me_approval_status_display: {
        type: "string",
        nullable: true,
        example: "Approved",
      },
      custbody_me_delegate_approver: {
        type: "string",
        nullable: true,
        example: null,
      },
      custbody_me_wf_in_delegation: {
        type: "boolean",
        nullable: true,
        example: false,
      },
      custbody_me_wf_next_approver_blank: {
        type: "boolean",
        nullable: true,
        example: false,
      },
      nextapprover: { type: "string", nullable: true, example: null },
      custbody_cseg_cn_cfi: { type: "string", nullable: true, example: "1" },
      custbody_cseg_cn_cfi_display: {
        type: "string",
        nullable: true,
        example: "CFI 1",
      },
      custbody_me_logistic_vendor: {
        type: "string",
        nullable: true,
        example: "10",
      },
      custbody_me_logistic_vendor_display: {
        type: "string",
        nullable: true,
        example: "Logistic Vendor A",
      },
      custbody_me_gross_weight: {
        type: "string",
        nullable: true,
        example: "120.5",
      },
      custbody_me_related_invoice: {
        type: "string",
        nullable: true,
        example: "INV-001",
      },
      custbody_me_rate_id: { type: "string", nullable: true, example: "1" },
      custbody_me_rate_id_display: {
        type: "string",
        nullable: true,
        example: "Rate 1",
      },
      custbody_me_packages: { type: "string", nullable: true, example: "2" },
      custbody_me_total_packages: {
        type: "string",
        nullable: true,
        example: "2",
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
      transferlocation: { type: "string", nullable: true, example: "20" },
      transferlocation_display: {
        type: "string",
        nullable: true,
        example: "Warehouse B",
      },
      department: { type: "string", nullable: true, example: "5" },
      department_display: {
        type: "string",
        nullable: true,
        example: "Logistics",
      },
      class: { type: "string", nullable: true, example: "2" },
      class_display: {
        type: "string",
        nullable: true,
        example: "Accessories",
      },
      datecreated: {
        type: "string",
        nullable: true,
        example: "2026-03-18T08:00:00+07:00",
      },
      lines: {
        type: "array",
        nullable: true,
        items: { type: "object" },
        example: [{ item: "A", qty: 2 }],
      },
      user_notes: {
        type: "array",
        nullable: true,
        items: { type: "object" },
        example: [{ note: "Handle with care" }],
      },
      files: {
        type: "array",
        nullable: true,
        items: { type: "object" },
        example: [{ fileName: "photo.jpg", fileUrl: "https://..." }],
      },
      created_at: { type: "string", example: "2026-03-18T08:56:00+07:00" },
      created_by: { type: "string", nullable: true, example: "Admin" },
      updated_at: {
        type: "string",
        nullable: true,
        example: "2026-03-18T09:00:00+07:00",
      },
      updated_by: { type: "string", nullable: true, example: "Admin" },
      deleted_at: { type: "string", nullable: true, example: null },
      deleted_by: { type: "string", nullable: true, example: null },
      is_delete: { type: "boolean", example: false },
    },
  },
  FulfillmentsListResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/FulfillmentItem" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      message: { type: "string", example: "Data fulfillments berhasil diambil" },
    },
  },
  FulfillmentDetailResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: { $ref: "#/components/schemas/FulfillmentItem" },
      message: { type: "string", example: "Data fulfillment berhasil diambil" },
    },
  },
  ItemDetailResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "e520cef0-d85b-475a-bb85-45c66fddbcc9",
          },
          netsuite_id: { type: "string", example: "22807" },
          item_id: { type: "string", example: "DZ15221100004K" },
          display_name: {
            type: "string",
            nullable: true,
            example: "STANDARD CAB BODY (8)",
          },
          data: { type: "object", description: "Raw data JSON dari NetSuite" },
          last_modified_netsuite: {
            type: "string",
            nullable: true,
            example: "2026-03-18T08:56:00+07:00",
          },
          created_at: {
            type: "string",
            example: "2026-03-18T08:56:00+07:00",
          },
          updated_at: {
            type: "string",
            nullable: true,
            example: "2026-03-18T09:00:00+07:00",
          },
          is_deleted: { type: "boolean", example: false },
          type: { type: "string", nullable: true, example: "Inventory Item" },
          locations: {
            type: "array",
            nullable: true,
            items: { type: "object" },
          },
          type_id: { type: "string", nullable: true, example: "InvtPart" },
          price_levels: {
            type: "array",
            nullable: true,
            items: { type: "object" },
          },
        },
      },
      message: { type: "string", example: "Data item berhasil diambil" },
    },
  },
  ItemLocationsRequest: {
    type: "object",
    properties: {
      page: { type: "integer", default: 1, example: 1 },
      limit: { type: "integer", default: 10, example: 10 },
      sort_by: { type: "string", default: "created_at", example: "created_at" },
      sort_order: { type: "string", default: "desc", example: "desc" },
      search: { type: "string", default: "", example: "" },
      netsuite_item_id: {
        type: "string",
        nullable: true,
        description: "Berdasarkan kolom netsuite_id di tabel items",
        example: "26614",
      },
    },
  },
  ItemLocationsListResponse: {
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
                id: { type: "string", example: "6687f24a-8292-4481-8366-c2fea7db461a" },
                inventorylocationId: { type: "integer", example: 19 },
                item_id: { type: "string", example: "26614" },
                location_name: { type: "string", example: "Jakarta - IEC" },
                qtyAvailable: { type: "string", example: "14" },
                qtyOnHand: { type: "string", example: "14" },
                qtyOnOrder: { type: "string", example: "0" },
                qtyCommitted: { type: "string", example: "0" },
                qtyBackOrder: { type: "string", example: "0" },
                serialNumbers: { type: "array", items: { type: "object" } },
                created_at: {
                  type: "string",
                  example: "2026-06-24T06:33:04.599Z",
                },
                updated_at: {
                  type: "string",
                  example: "2026-06-24T06:33:04.599Z",
                },
              },
            },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      message: {
        type: "string",
        example: "Data item locations berhasil diambil",
      },
    },
  },
  ItemTierPricesRequest: {
    type: "object",
    properties: {
      page: { type: "integer", default: 1, example: 1 },
      limit: { type: "integer", default: 10, example: 10 },
      sort_by: { type: "string", default: "created_at", example: "created_at" },
      sort_order: { type: "string", default: "desc", example: "desc" },
      search: { type: "string", default: "", example: "" },
      netsuite_item_id: {
        type: "string",
        nullable: true,
        description: "Berdasarkan kolom netsuite_id di tabel items",
        example: "22230",
      },
    },
  },
  ItemTierPricesListResponse: {
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
                id: { type: "string", example: "a06d64fd-1fe6-491f-a65b-1f1ab202f37b" },
                item_id: { type: "string", example: "22230" },
                price_level: { type: "string", example: "Harga Dasar" },
                price: { type: "string", example: "100000.00" },
                quantity: { type: "string", example: "0" },
                created_at: {
                  type: "string",
                  example: "2026-09-04T08:59:47.706Z",
                },
                created_by: { type: "string", nullable: true, example: null },
                updated_at: {
                  type: "string",
                  example: "2026-09-04T08:59:47.706Z",
                },
                updated_by: { type: "string", nullable: true, example: null },
              },
            },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      message: {
        type: "string",
        example: "Data item tier prices berhasil diambil",
      },
    },
  },
  ItemSerialNumbersRequest: {
    type: "object",
    properties: {
      page: { type: "integer", default: 1, example: 1 },
      limit: { type: "integer", default: 10, example: 10 },
      sort_by: { type: "string", default: "created_at", example: "created_at" },
      sort_order: { type: "string", default: "desc", example: "desc" },
      search: { type: "string", default: "", example: "" },
      is_used: {
        type: "boolean",
        nullable: true,
        description: "Filter berdasarkan kolom is_used (true atau false)",
        example: true,
      },
      netsuite_item_id: {
        type: "string",
        nullable: true,
        description: "Berdasarkan kolom netsuite_id di tabel items",
        example: "26606",
      },
    },
  },
  ItemSerialNumbersListResponse: {
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
                id: { type: "string", example: "07ce4ae8-b792-43b0-a236-e1e9095deb63" },
                item_id: { type: "string", example: "26606" },
                inventorylocationId: { type: "string", example: "114" },
                serial_number: {
                  type: "string",
                  example: "202608030001-01",
                },
                is_used: { type: "boolean", example: true },
                created_at: {
                  type: "string",
                  example: "2026-09-04T08:58:01.865Z",
                },
                created_by: { type: "string", nullable: true, example: null },
                updated_at: {
                  type: "string",
                  example: "2026-09-04T08:58:01.865Z",
                },
                updated_by: { type: "string", nullable: true, example: null },
              },
            },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      message: {
        type: "string",
        example: "Data item serial numbers berhasil diambil",
      },
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
