/**
 * Swagger API Path Definitions for Faktur Module
 */

const fakturPaths = {
  '/faktur/get': {
    post: {
      tags: ['Faktur'],
      summary: 'Get list of faktur',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/FakturListRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FakturListResponse' }
            }
          }
        }
      }
    }
  },
  '/faktur/create': {
    post: {
      tags: ['Faktur'],
      summary: 'Create new faktur',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/FakturRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FakturResponse' }
            }
          }
        }
      }
    }
  },
  '/faktur/{id}': {
    get: {
      tags: ['Faktur'],
      summary: 'Get faktur by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FakturResponse' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Faktur'],
      summary: 'Update faktur by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/FakturRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FakturResponse' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Faktur'],
      summary: 'Delete faktur by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      responses: {
        200: {
          description: 'Deleted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/faktur/sync-from-invoice': {
    post: {
      tags: ['Faktur'],
      summary: 'Sync faktur dari invoice sales order lokal',
      description: 'Membaca data dari tabel `invoice_sales_orders` berdasarkan `netsuite_id`, lalu membuat atau mengupdate record di tabel `fakturs` dan `faktur_details` menggunakan proses yang sama dengan `syncToFakturs`.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/FakturSyncFromInvoiceRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FakturSyncFromInvoiceResponse' }
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
        404: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/faktur/sync-from-invoice/{netsuite_id}': {
    post: {
      tags: ['Faktur'],
      summary: 'Sync faktur dari invoice sales order lokal by single netsuite_id',
      description: 'Sama seperti `/faktur/sync-from-invoice`, tetapi `netsuite_id` dikirim melalui path parameter.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'netsuite_id',
          in: 'path',
          required: true,
          schema: { type: 'integer', example: 2532 }
        }
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FakturSyncFromInvoiceByIdResponse' }
            }
          }
        },
        404: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/faktur/status-bulk': {
    post: {
      tags: ['Faktur'],
      summary: 'Bulk update status faktur',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid', example: 'f0b57258-5f33-4e03-81f7-cd70d833b5c5' },
                  status: { type: 'boolean', example: true }
                }
              }
            }
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
                  data: { type: 'array', items: { type: 'object' } },
                  message: { type: 'string', example: 'Status faktur berhasil diupdate secara bulk' }
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = fakturPaths;
