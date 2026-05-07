/**
 * Swagger API Path Definitions for Sync Module
 */

const syncPaths = {
  '/sync/get': {
    post: {
      tags: ['Sync'],
      summary: 'Get list of syncs',
      description: 'Fetch data dari tabel syncs dengan pagination, search, dan sorting.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SyncGetRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SyncListResponse' }
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

  '/sync/modules': {
    post: {
      tags: ['Sync'],
      summary: 'Sync specific module',
      description: 'Trigger background synchronization for a specific module.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['module'],
              properties: {
                module: {
                  type: 'string',
                  enum: ['classes', 'department', 'invoice_sales_orders', 'items', 'locations', 'purchasing_orders', 'sales_orders', 'terms', 'vendors'],
                  example: 'classes'
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
              schema: { $ref: '#/components/schemas/SyncItemResponse' }
            }
          }
        },
        400: {
          description: 'Bad Request - Sync sedang berjalan atau parameter tidak lengkap',
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

  '/sync/create': {
    post: {
      tags: ['Sync'],
      summary: 'Create new sync record',
      description: 'Membuat data baru di tabel syncs. Field created_by dan updated_by diisi otomatis dari token.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SyncCreateRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SyncItemResponse' }
            }
          }
        },
        400: {
          description: 'Bad Request - Validation Error',
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

  '/sync/all': {
    get: {
      tags: ['Sync'],
      summary: 'Sync all modules (Orchestration)',
      description: 'Trigger chained background synchronization for all modules in sequence. Endpoint ini dapat dipanggil tanpa token (Public).',
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
                      message: { type: 'string', example: 'Sync all process initiated' },
                      firstModule: { type: 'string', example: 'classes' }
                    }
                  },
                  message: { type: 'string', example: 'Sync all process initiated' }
                }
              }
            }
          }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/sync/{id}': {
    get: {
      tags: ['Sync'],
      summary: 'Get sync by ID',
      description: 'Mengambil satu data sync berdasarkan sync_id.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'UUID dari sync record'
        }
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SyncItemResponse' }
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
        404: {
          description: 'Not Found',
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
    },

    put: {
      tags: ['Sync'],
      summary: 'Update sync by ID',
      description: 'Update data sync berdasarkan sync_id. Field updated_by diisi otomatis dari token.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'UUID dari sync record'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SyncCreateRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SyncItemResponse' }
            }
          }
        },
        400: {
          description: 'Bad Request - Validation Error',
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
        404: {
          description: 'Not Found',
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
    },

    delete: {
      tags: ['Sync'],
      summary: 'Delete sync by ID',
      description: 'Soft delete data sync berdasarkan sync_id. Field deleted_by diisi otomatis dari token.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'UUID dari sync record'
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
                  message: { type: 'string', example: 'Data sync berhasil dihapus' },
                  timestamp: { type: 'string', format: 'date-time' }
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
        404: {
          description: 'Not Found',
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
  }
};

module.exports = syncPaths;
