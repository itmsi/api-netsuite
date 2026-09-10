/**
 * Swagger Schema Definitions for Inventory Adjustments Module
 */

const inventoryAdjustmentsSchemas = {
  InventoryAdjustmentsGetRequest: {
    type: "object",
    properties: {
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 20 },
      sort_by: {
        type: "string",
        enum: [
          "last_modified",
          "tranid",
          "trandate",
          "created_at",
          "updated_at",
        ],
        example: "last_modified",
      },
      sort_order: {
        type: "string",
        enum: ["ASC", "DESC"],
        example: "DESC",
      },
      search: {
        type: "string",
        description:
          "Cari berdasarkan tranid, memo, customer, subsidiary, atau location",
        example: "IEC-2026",
      },
      subsidiary: { type: "integer", example: 6 },
      adj_location: { type: "integer", example: 2 },
      department: { type: "integer", example: 103 },
      customer_id: { type: "integer", example: 1445 },
      classes: {
        type: "integer",
        description: "Filter berdasarkan class (parent), termasuk children-nya",
        example: 3,
      },
    },
  },
  InventoryAdjustmentItem: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "b1f2c3d4-5678-90ab-cdef-1234567890ab",
      },
      netsuite_id: { type: "string", example: "77442" },
      subsidiary: { type: "integer", example: 6 },
      subsidiary_display: {
        type: "string",
        nullable: true,
        example: "Motorsights International",
      },
      account: { type: "integer", example: 128 },
      account_display: {
        type: "string",
        nullable: true,
        example: "Inventory Asset",
      },
      adj_location: { type: "integer", example: 2 },
      adj_location_display: {
        type: "string",
        nullable: true,
        example: "Main Warehouse",
      },
      department: { type: "integer", example: 103 },
      department_display: {
        type: "string",
        nullable: true,
        example: "Warehouse",
      },
      trandate: { type: "string", nullable: true, example: "2026-03-18" },
      class_id: { type: "integer", example: 3 },
      class_display: { type: "string", nullable: true, example: "Assembly" },
      memo: {
        type: "string",
        nullable: true,
        example: "Testing Penyesuaian stok Assembly | Assembly | oke | dev 3",
      },
      customer_id: { type: "integer", nullable: true, example: 1445 },
      customer_display: {
        type: "string",
        nullable: true,
        example: "PT Contoh Customer",
      },
      me_po_number: { type: "string", nullable: true, example: "4464" },
      customform: { type: "integer", example: 112 },
      lines: {
        type: "array",
        items: { $ref: "#/components/schemas/InventoryAdjustmentLine" },
      },
      postingperiod: { type: "integer", nullable: true, example: 45 },
      postingperiod_display: {
        type: "string",
        nullable: true,
        example: "Mar 2026",
      },
      custbody_me_description: {
        type: "string",
        nullable: true,
        example: "Keterangan header",
      },
      custbody_me_inv_customer: {
        type: "integer",
        nullable: true,
        example: 2453,
      },
      custbody_me_purchase_order_number: {
        type: "string",
        nullable: true,
        example: "4464",
      },
      custbody_msi_cycle_count_cumber: {
        type: "string",
        nullable: true,
        example: "Purchase Order #PO-IEC-2026-000032",
      },
      custbody_me_opening_balance: {
        type: "boolean",
        nullable: true,
        example: false,
      },
      custbody_me_approval_status: {
        type: "string",
        nullable: true,
        example: "1",
      },
      custbody_me_approval_status_display: {
        type: "string",
        nullable: true,
        example: "Pending Approval",
      },
      nextapprover: {
        type: "string",
        nullable: true,
        example: "dharmaridwan@motorsights.net",
      },
      last_modified: {
        type: "string",
        nullable: true,
        example: "2026-03-18T10:00:00Z",
      },
      datecreated: {
        type: "string",
        nullable: true,
        example: "2026-03-18T09:00:00Z",
      },
      user_notes: { type: "array", items: { type: "object" }, nullable: true },
      files: { type: "array", items: { type: "object" }, nullable: true },
      tranid: { type: "string", nullable: true, example: "ADJ-000123" },
      created_at: { type: "string", format: "date-time" },
      created_by: {
        type: "string",
        nullable: true,
        example: "f0b57258-5f33-4e03-81f7-cd70d833b5c5",
      },
      created_by_name: {
        type: "string",
        nullable: true,
        description:
          "Nama employee pembuat (join ke gate_sso_employees), fallback ke nama dari NetSuite jika bukan dibuat via API",
        example: "Dharma Ridwan",
      },
      updated_at: { type: "string", format: "date-time" },
      updated_by: {
        type: "string",
        nullable: true,
        example: "dharmaridwan@motorsights.net",
      },
      updated_by_name: {
        type: "string",
        nullable: true,
        description: "Nama employee yang terakhir update (join ke gate_sso_employees)",
        example: "Dharma Ridwan",
      },
    },
  },
  InventoryAdjustmentLine: {
    type: "object",
    properties: {
      item: { type: "integer", example: 22230 },
      location: { type: "integer", example: 2 },
      quantity: { type: "number", example: -3 },
      unit_cost: { type: "number", example: 150000 },
      department: { type: "integer", example: 103 },
      class: { type: "integer", example: 3 },
      custcol_me_purchase_number_line: {
        type: "string",
        nullable: true,
        example: "Purchase Order #MSI-PO-0001",
      },
      memo: { type: "string", nullable: true, example: "Catatan baris" },
      serials: {
        type: "array",
        items: { type: "string" },
        nullable: true,
        example: ["SN001", "SN002"],
      },
    },
  },
  InventoryAdjustmentsListResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/InventoryAdjustmentItem" },
          },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 20 },
              total: { type: "integer", example: 1 },
              totalPages: { type: "integer", example: 1 },
            },
          },
        },
      },
      sync_info: {
        type: "object",
        nullable: true,
        properties: {
          sync_status: { type: "string", example: "success" },
          created_at: { type: "string", format: "date-time" },
          created_by_name: {
            type: "string",
            nullable: true,
            example: "dharmaridwan",
          },
        },
      },
      message: {
        type: "string",
        example: "Data inventory adjustments berhasil diambil",
      },
    },
  },
  InventoryAdjustmentDetailResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: { $ref: "#/components/schemas/InventoryAdjustmentItem" },
      message: {
        type: "string",
        example: "Data inventory adjustment berhasil diambil",
      },
    },
  },
  CreateInventoryAdjustmentRequest: {
    type: "object",
    required: ["adjlocation", "lines"],
    properties: {
      customform: { type: "integer", example: 112 },
      subsidiary: { type: "integer", example: 6 },
      account: { type: "integer", example: 128 },
      department: { type: "integer", example: 103 },
      class: { type: "integer", example: 3 },
      adjlocation: { type: "integer", example: 2 },
      memo: {
        type: "string",
        nullable: true,
        example: "Testing Penyesuaian stok Assembly | Assembly | oke | dev 3",
      },
      customer: { type: "integer", nullable: true, example: 1445 },
      created_by: {
        type: "string",
        nullable: true,
        description:
          "Identifier user yang membuat inventory adjustment (opsional, default diambil dari user login)",
        example: "f0b57258-5f33-4e03-81f7-cd70d833b5c5",
      },
      custbody_me_description: {
        type: "string",
        nullable: true,
        example: "Keterangan header",
      },
      custbody_me_inv_customer: {
        type: "integer",
        nullable: true,
        example: 2453,
      },
      custbody_me_purchase_order_number: {
        type: "integer",
        nullable: true,
        example: 4464,
      },
      custbody_msi_cycle_count_cumber: {
        type: "string",
        nullable: true,
        example: "Purchase Order #PO-IEC-2026-000032",
      },
      lines: {
        type: "array",
        items: {
          type: "object",
          required: ["item", "location", "quantity"],
          properties: {
            item: { type: "integer", example: 22230 },
            location: { type: "integer", example: 2 },
            quantity: { type: "number", example: -3 },
            unit_cost: { type: "number", example: 150000 },
            department: { type: "integer", example: 103 },
            class: { type: "integer", example: 3 },
            custcol_me_purchase_number_line: {
              type: "string",
              nullable: true,
              example: "Purchase Order #MSI-PO-0001",
            },
            memo: { type: "string", nullable: true, example: "Catatan baris" },
            serials: {
              type: "array",
              items: { type: "string" },
              nullable: true,
              example: ["SN001", "SN002"],
            },
          },
        },
      },
    },
  },
  CreateInventoryAdjustmentResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: {
        type: "object",
        description: "Response dari bridge API (NetSuite)",
      },
      message: {
        type: "string",
        example: "Inventory adjustment berhasil dibuat",
      },
    },
  },
};

module.exports = inventoryAdjustmentsSchemas;
