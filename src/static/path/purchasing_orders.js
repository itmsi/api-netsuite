/**
 * Swagger API Path Definitions for Purchasing Orders Module
 */

const purchasingOrdersPaths = {
  '/purchasing-orders/get-list': {
    post: {
      tags: ['Purchasing Orders'],
      summary: 'Get list of purchase orders',
      description: 'Fetch purchase orders dengan pagination dari database lokal (bridge_sanbox.purchase_orders). Data sudah tersimpan dari hasil sync sebelumnya via endpoint /sync.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PurchaseOrderListRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      items: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/PurchaseOrder' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Data purchase orders berhasil diambil' }
                }
              }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/purchasing-orders/sync': {
    post: {
      tags: ['Purchasing Orders'],
      summary: 'Sync purchase orders dari bridge API',
      description: 'Fetch purchase orders langsung dari bridge API (NetSuite) dengan pagination. Format response identik dengan `/get-list`. Gunakan endpoint ini untuk mendapatkan data real-time dari NetSuite.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PurchaseOrderListRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      items: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/PurchaseOrder' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Data purchase orders berhasil di-sync dari bridge API' }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/purchasing-orders/create': {
    post: {
      tags: ['Purchasing Orders'],
      summary: 'Create a new purchase order',
      description: 'Create a new purchase order via bridge API and return the result from NetSuite',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PurchaseOrderCreateRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Purchase order created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object', description: 'Raw response from bridge API' },
                  message: { type: 'string', example: 'Purchase order berhasil dibuat' }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request - validation error from bridge API',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/purchasing-orders/update': {
    put: {
      tags: ['Purchasing Orders'],
      summary: 'Update an existing purchase order',
      description: 'Update a purchase order via bridge API and return the result from NetSuite',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PurchaseOrderUpdateRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Purchase order updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object', description: 'Raw response from bridge API' },
                  message: { type: 'string', example: 'Purchase order berhasil diupdate' }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request - validation error from bridge API',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/purchasing-orders/approval': {
    post: {
      tags: ['Purchasing Orders'],
      summary: 'Approve a purchase order',
      description: 'Trigger the approval workflow for a purchase order via bridge API',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PurchaseOrderApprovalRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Approval successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PurchaseOrderApprovalResponse' }
            }
          }
        },
        400: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/purchasing-orders/sync/{id}': {
    get: {
      tags: ['Purchasing Orders'],
      summary: 'Sync single purchase order by ID dari bridge API',
      description: 'Hit bridge API `GET /api/v1/bridge/purchase-orders/sync/{id}` untuk sync satu purchase order berdasarkan ID. Hasil sync dicatat di tabel `syncs`.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'NetSuite internal ID dari purchase order (po_id)',
          schema: { type: 'integer', example: 7337 }
        }
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object', description: 'Raw response dari bridge API' },
                  message: { type: 'string', example: 'Purchase order ID 7337 berhasil di-sync dari bridge API' }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request - ID not provided',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/purchasing-orders/{id}': {
    get: {
      tags: ['Purchasing Orders'],
      summary: 'Get purchase order detail by ID',
      description: 'Fetch a single purchase order detail from NetSuite RESTlet directly using OAuth 1.0. The `id` (po_id) is passed as a URL parameter.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'The NetSuite internal ID of the purchase order (po_id)',
          schema: { type: 'integer', example: 7102 }
        }
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PurchaseOrderDetailResponse' }
            }
          }
        },
        400: {
          description: 'Bad Request - ID not provided',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/purchasing-orders/print': {
    post: {
      tags: ['Purchasing Orders'],
      summary: 'Print a purchase order',
      description: 'Print a purchase order via bridge API and return the base64 PDF content',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['recId'],
              properties: {
                recId: { type: 'integer', example: 4152 }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Print successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  mimeType: { type: 'string', example: 'application/pdf' },
                  fileName: { type: 'string', example: 'INV_4152.pdf' },
                  fileContent: { type: 'string', description: 'Base64 encoded PDF content' }
                }
              }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  }
};

module.exports = purchasingOrdersPaths;
