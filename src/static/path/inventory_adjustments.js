/**
 * Swagger API Path Definitions for Inventory Adjustments Module
 */

const inventoryAdjustmentsPaths = {
  "/inventory_adjustments/get": {
    post: {
      tags: ["Inventory Adjustments"],
      summary: "Get list of inventory adjustments",
      description:
        "Fetch inventory adjustments dengan pagination dari database lokal (bridge_sanbox.inventory_adjustments).",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/InventoryAdjustmentsGetRequest",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/InventoryAdjustmentsListResponse",
              },
            },
          },
        },
        500: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/inventory_adjustments/sync/{id}": {
    get: {
      tags: ["Inventory Adjustments"],
      summary: "Sync single inventory adjustment by ID dari bridge API",
      description:
        "Hit bridge API `POST /api/v1/bridge/inventory/adjustments/sync/{id}` untuk sync satu inventory adjustment berdasarkan NetSuite internal ID, lalu ambil ulang data terbaru dari database lokal.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "NetSuite internal ID dari inventory adjustment",
          example: "77442",
        },
      ],
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/InventoryAdjustmentDetailResponse",
              },
            },
          },
        },
        400: {
          description: "Bad Request - id kosong",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Not Found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        500: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/inventory_adjustments/create": {
    post: {
      tags: ["Inventory Adjustments"],
      summary: "Create inventory adjustment via bridge API",
      description:
        "Hit bridge API `POST /api/v1/bridge/inventory/adjustments` untuk membuat inventory adjustment baru di NetSuite.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/CreateInventoryAdjustmentRequest",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateInventoryAdjustmentResponse",
              },
            },
          },
        },
        400: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        500: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/inventory_adjustments/{id}": {
    get: {
      tags: ["Inventory Adjustments"],
      summary: "Get inventory adjustment detail by id",
      description:
        "Fetch a single inventory adjustment detail dari tabel lokal bridge_sanbox.inventory_adjustments berdasarkan id (UUID) atau netsuite_id (string).",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "UUID (kolom id) atau NetSuite internal ID (kolom netsuite_id)",
          example: "77442",
        },
      ],
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/InventoryAdjustmentDetailResponse",
              },
            },
          },
        },
        400: {
          description: "Bad Request - id kosong",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Not Found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        500: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
};

module.exports = inventoryAdjustmentsPaths;
