/**
 * Swagger API Path Definitions for Items Module
 */

const itemsPaths = {
  "/items/get-list": {
    post: {
      tags: ["Items"],
      summary: "Get list of items",
      description:
        "Fetch items dengan pagination dari database lokal (bridge_sanbox.items). Data sudah tersimpan dari hasil sync sebelumnya via endpoint /sync.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ItemsRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ItemsListResponse" },
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
  "/items/sync": {
    post: {
      tags: ["Items"],
      summary: "Sync items dari bridge API",
      description:
        "Fetch items langsung dari bridge API (NetSuite) dengan pagination. Format response identik dengan `/get-list`. Gunakan endpoint ini untuk mendapatkan data real-time dari NetSuite.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ItemsRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ItemsListResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
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
  "/items/sync/{id}": {
    get: {
      tags: ["Items"],
      summary: "Sync single item by ID dari bridge API",
      description:
        "Hit bridge API `POST /api/v1/bridge/items/sync/netsuite/{id}` untuk sync satu item berdasarkan NetSuite internal ID, lalu ambil ulang data item tersebut dari database lokal (format sama dengan get by netsuite_id).",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "NetSuite internal ID dari item",
          schema: { type: "integer", example: 7337 },
        },
      ],
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ItemSyncByIdResponse" },
            },
          },
        },
        400: {
          description: "Bad Request - ID not provided",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        404: {
          description: "Not Found - Item tidak ditemukan di database lokal setelah sync",
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
  "/items/get-item-location": {
    post: {
      tags: ["Items"],
      summary: "Get item locations",
      description:
        "Fetch item locations from local database joined with locations and items where qtyAvailable > 0.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 10 },
                sort_by: {
                  type: "string",
                  example: "created_at",
                  description:
                    "Column to sort by (e.g., created_at, item_code, location_name)",
                },
                sort_order: {
                  type: "string",
                  example: "desc",
                  description: "Sort order (asc or desc)",
                },
                search: {
                  type: "string",
                  description:
                    "Search by item_id, display_name, or location_name",
                  example: "item",
                },
              },
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
                            inventorylocationId: { type: "string" },
                            item_id: { type: "string" },
                            location_name: { type: "string" },
                            item_code: { type: "string" },
                            item_name: { type: "string" },
                            qtyAvailable: { type: "string" },
                            qtyBackOrder: { type: "string" },
                            qtyCommitted: { type: "string" },
                            qtyOnHand: { type: "string" },
                            qtyOnOrder: { type: "string" },
                          },
                        },
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "integer", example: 1 },
                          limit: { type: "integer", example: 10 },
                          total: { type: "integer", example: 50 },
                          totalPages: { type: "integer", example: 5 },
                        },
                      },
                    },
                  },
                  message: {
                    type: "string",
                    example: "Data item locations berhasil diambil",
                  },
                },
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
  "/items/get-receipts": {
    post: {
      tags: ["Items"],
      summary: "Get receipts dari local database",
      description:
        "Fetch receipts dari tabel lokal bridge_sanbox.receives dengan pagination dan filter sederhana.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ReceiptsRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReceiptsListResponse" },
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
  "/items/get-receipts/{id}": {
    get: {
      tags: ["Items"],
      summary: "Get receipt detail by id",
      description:
        "Fetch a single receipt detail dari tabel lokal bridge_sanbox.receives berdasarkan id (UUID) atau netsuite_id.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "UUID (id) atau netsuite_id dari receipt",
          example: "588",
        },
      ],
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReceiptDetailResponse" },
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
  "/items/create-receipts": {
    post: {
      tags: ["Items"],
      summary: "Create item receipt via bridge API",
      description:
        "Hit bridge API `POST /api/v1/bridge/items/item-receipt` untuk membuat item receipt dari purchase order, transfer order, atau customer return.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateReceiptRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateReceiptResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
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

module.exports = itemsPaths;
