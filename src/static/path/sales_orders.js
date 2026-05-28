/**
 * Swagger API Path Definitions for Sales Orders Module
 */

const syncInfoSchema = {
  type: 'object',
  nullable: true,
  properties: {
    sync_status: { type: 'string', example: 'success' },
    created_at: { type: 'string', example: '2026-04-15T07:44:27.781Z' },
    created_by_name: { type: 'string', nullable: true, example: 'abdul harris' }
  }
};

const salesOrdersPaths = {
  '/sales-orders/get': {
    post: {
      tags: ['Sales Orders'],
      summary: 'Get list of sales orders',
      description: 'Fetch sales orders dengan pagination dari database lokal (bridge_sanbox.sales_orders). Response termasuk `sync_info` dari tabel `syncs`.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SalesOrderListRequest' }
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
                      items: { type: 'array', items: { $ref: '#/components/schemas/SalesOrder' } },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  sync_info: syncInfoSchema,
                  message: { type: 'string', example: 'Data sales orders berhasil diambil' }
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

  '/sales-orders/sync': {
    post: {
      tags: ['Sales Orders'],
      summary: 'Sync sales orders dari bridge API',
      description: 'Hit bridge API `POST /api/v1/bridge/sales-orders/get` untuk sync data sales orders. Hasil sync dicatat di tabel `syncs` dan `sync_info` dikembalikan di response.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SalesOrderSyncRequest' }
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
                  data: { type: 'object', description: 'Raw response dari bridge API' },
                  sync_info: syncInfoSchema,
                  message: { type: 'string', example: 'Data sales orders berhasil di-sync dari bridge API' }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/sales-orders/create': {
    post: {
      tags: ['Sales Orders'],
      summary: 'Create a new sales order',
      description: 'Create a new sales order via bridge API `POST /api/v1/bridge/sales-orders/create`.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SalesOrderCreateRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Sales order created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object', description: 'Raw response dari bridge API' },
                  message: { type: 'string', example: 'Sales order berhasil dibuat' }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/sales-orders/update': {
    put: {
      tags: ['Sales Orders'],
      summary: 'Update an existing sales order',
      description: 'Update a sales order via bridge API `PUT /api/v1/bridge/sales-orders/update`. Field `id` wajib diisi.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SalesOrderUpdateRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Sales order updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object', description: 'Raw response dari bridge API' },
                  message: { type: 'string', example: 'Sales order berhasil diupdate' }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/sales-orders/sync/{id}': {
    get: {
      tags: ['Sales Orders'],
      summary: 'Sync single sales order by ID',
      description: 'Sync single sales order dari bridge API `GET /api/v1/bridge/sales-orders/sync/{id}`.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'NetSuite internal ID (netsuite_id) atau UUID (id) dari sales order',
          schema: { type: 'string', example: '11273' }
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
                  message: { type: 'string', example: 'Sync sales order ID 11273 berhasil' }
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

  '/sales-orders/{id}': {
    get: {
      tags: ['Sales Orders'],
      summary: 'Get sales order by ID dari DB lokal',
      description: 'Fetch single sales order dari database lokal (bridge_sanbox.sales_orders) berdasarkan `netsuite_id` atau UUID `id`.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'NetSuite internal ID (netsuite_id) atau UUID (id) dari sales order',
          schema: { type: 'string', example: '11273' }
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
                  data: {
                    type: 'object',
                    properties: {
                      items: { type: 'array', items: { $ref: '#/components/schemas/SalesOrder' } },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  sync_info: syncInfoSchema,
                  message: { type: 'string', example: 'Data sales order ID 7840 berhasil diambil' }
                }
              }
            }
          }
        },
        404: {
          description: 'Not Found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },

  '/sales-orders/upload': {
    post: {
      tags: ['Sales Orders'],
      summary: 'Upload file to Nextcloud Temp Directory',
      description: 'Upload a file and get a temporary Nextcloud public share link.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'The file to upload'
                },
                file_name: {
                  type: 'string',
                  description: 'Optional custom file name. Will be normalized to lowercase with spaces replaced by underscores (_)'
                },
                so_id: {
                  type: 'string',
                  description: 'Optional SO ID, so id sementara yg akan di buat oleh FE, prosesnya ketika add file akan insert file dan so_id sementara, jangan sampe ui di refres, jika di refres maka akan generated so_id baru di FE'
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
                  id: { type: 'string', example: 'f0b57258-5f33-4e03-81f7-cd70d833b5c5' },
                  soId: { type: 'string', example: 'temp-001' },
                  fileUrl: { type: 'string', example: 'https://cloud.inlinegroupdc.com/s/abcdefgh' },
                  storagePath: { type: 'string', example: '/temp/123456789_file.pdf' },
                  fileName: { type: 'string', example: '123456789_file.pdf' }
                }
              }
            }
          }
        },
        500: {
          description: 'Internal Server Error'
        }
      }
    }
  },
  '/sales-orders/upload/finalize': {
    post: {
      tags: ['Sales Orders'],
      summary: 'Finalize file upload',
      description: 'Move file from temp to final folder based on so_id',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['so_id', 'storage_path'],
              properties: {
                so_id: { type: 'string', example: '1001' },
                storage_path: { type: 'string', example: '/temp/123456789_file.pdf' }
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
                  path: { type: 'string', example: '/uploads/so/2026/1001/123456789_file.pdf' }
                }
              }
            }
          }
        },
        500: {
          description: 'Internal Server Error'
        }
      }
    }
  },
  '/sales-orders/upload-delete': {
    post: {
      tags: ['Sales Orders'],
      summary: 'Delete uploaded file by share URL',
      description: 'Delete uploaded file by share URL (fileUrl) from local database and Nextcloud WebDAV.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['fileUrl'],
              properties: {
                fileUrl: { type: 'string', example: 'https://cloud.inlinegroupdc.com/s/abcdefgh' }
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
                  message: { type: 'string', example: 'File deleted successfully' }
                }
              }
            }
          }
        },
        404: {
          description: 'File not found'
        },
        500: {
          description: 'Internal Server Error'
        }
      }
    }
  },
  '/sales-orders/upload-update': {
    post: {
      tags: ['Sales Orders'],
      summary: 'Update uploaded file by share URL',
      description: 'Update uploaded file by share URL. Can replace the file itself, change the filename, or both.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['fileUrl'],
              properties: {
                fileUrl: {
                  type: 'string',
                  description: 'The share URL of the existing file to update',
                  example: 'https://cloud.inlinegroupdc.com/s/abcdefgh'
                },
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'Optional new file to replace the existing file'
                },
                file_name: {
                  type: 'string',
                  description: 'Optional new filename. Will be normalized to lowercase with spaces replaced by underscores (_)'
                },
                so_id: {
                  type: 'string',
                  description: 'Optional SO ID. If the file record does not exist for the provided fileUrl, this is used to create a new file record directly in the NetSuite SO folder.'
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
                  message: { type: 'string', example: 'File updated successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: 'f0b57258-5f33-4e03-81f7-cd70d833b5c5' },
                      soId: { type: 'string', example: 'temp-001' },
                      fileUrl: { type: 'string', example: 'https://cloud.inlinegroupdc.com/s/abcdefgh' },
                      storagePath: { type: 'string', example: '/temp/123456789_file.pdf' },
                      fileName: { type: 'string', example: 'file.pdf' }
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'File not found'
          },
          500: {
            description: 'Internal Server Error'
          }
        }
      }
    }
  }
};

module.exports = salesOrdersPaths;
