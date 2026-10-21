/**
 * Swagger Paths for Vendor Prepayment Module
 */

const errorResponses = {
  401: {
    description: 'Unauthorized - Token tidak valid atau tidak ada',
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
};

const badRequestResponse = {
  400: {
    description: 'Bad Request - Parameter wajib tidak diisi',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' }
      }
    }
  }
};

const vendorPrepaymentPaths = {
  '/vendor-prepayment/attachments-files/get': {
    post: {
      tags: ['Vendor Prepayment'],
      summary: 'Get Vendor Prepayment Attachments List',
      description: 'Mendapatkan daftar attachment vendor prepayment dari database lokal (tabel vendor_prepayment_attachments) dengan pagination, sorting, dan filtering',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/VendorPrepaymentAttachmentListRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Berhasil mendapatkan daftar attachment vendor prepayment',
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
                        items: { $ref: '#/components/schemas/VendorPrepaymentAttachment' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer', example: 1 },
                          limit: { type: 'integer', example: 20 },
                          total: { type: 'integer', example: 2 },
                          totalPages: { type: 'integer', example: 1 }
                        }
                      }
                    }
                  },
                  message: { type: 'string', example: 'Data vendor prepayment attachments berhasil diambil' }
                }
              }
            }
          }
        },
        ...errorResponses
      }
    }
  },
  '/vendor-prepayment/attachments-files/sync': {
    post: {
      tags: ['Vendor Prepayment'],
      summary: 'Sync Vendor Prepayment Attachments',
      description: 'Ambil daftar attachment satu vendor prepayment dari NetSuite via bridge API (POST /api/v1/bridge/vendor-prepayments/attachments-files/get)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/VendorPrepaymentAttachmentSyncRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Berhasil sync attachment vendor prepayment dari bridge API',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object', description: 'Response dari bridge API (header vendor prepayment + files)' },
                  message: { type: 'string', example: 'Attachments vendor prepayment netsuite_id 28015 berhasil di-sync dari bridge API' }
                }
              }
            }
          }
        },
        ...badRequestResponse,
        ...errorResponses
      }
    }
  },
  '/vendor-prepayment/attachments-files/sync/{id}': {
    post: {
      tags: ['Vendor Prepayment'],
      summary: 'Convert Vendor Prepayment Attachment File',
      description: 'Convert satu file attachment via bridge API (POST /api/v1/bridge/vendor-prepayments/attachments-files/converted). File akan berstatus PENDING sampai selesai diproses worker.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'NetSuite ID vendor prepayment',
          example: '28015'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/VendorPrepaymentAttachmentConvertRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'File sedang diproses convert',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/VendorPrepaymentAttachment' },
                  message: { type: 'string', example: 'File 2913 vendor prepayment netsuite_id 28015 sedang diproses convert' }
                }
              }
            }
          }
        },
        ...badRequestResponse,
        404: {
          description: 'Not Found - Vendor prepayment atau file tidak ditemukan di NetSuite',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        ...errorResponses
      }
    }
  },
  '/vendor-prepayment/attachments-files/download/{file_netsuite_id}': {
    get: {
      tags: ['Vendor Prepayment'],
      summary: 'Get Download Link Vendor Prepayment Attachment',
      description: 'Mendapatkan link download file attachment hasil convert berdasarkan file_netsuite_id via bridge API (POST /api/v1/bridge/vendor-prepayments/attachments-files/download)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'file_netsuite_id',
          required: true,
          schema: { type: 'string' },
          description: 'NetSuite ID file attachment',
          example: '2913'
        }
      ],
      responses: {
        200: {
          description: 'Berhasil mendapatkan link download',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Download link retrieved successfully' },
                  data: { type: 'object', description: 'Response dari bridge API (link download file)' }
                }
              }
            }
          }
        },
        404: {
          description: 'Not Found - File attachment tidak ditemukan',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        409: {
          description: 'Conflict - File belum / masih dalam proses convert',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        ...errorResponses
      }
    }
  },
  '/vendor-prepayment/get': {
    post: {
      tags: ['Vendor Prepayment'],
      summary: 'Get Vendor Prepayments List',
      description: 'Mendapatkan daftar vendor prepayment dari database lokal (tabel vendor_prepayments) dengan pagination, sorting, dan filtering',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/VendorPrepaymentListRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Berhasil mendapatkan daftar vendor prepayment',
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
                        items: { $ref: '#/components/schemas/VendorPrepayment' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer', example: 1 },
                          limit: { type: 'integer', example: 20 },
                          total: { type: 'integer', example: 25 },
                          totalPages: { type: 'integer', example: 2 }
                        }
                      }
                    }
                  },
                  sync_info: { type: 'object', nullable: true },
                  message: { type: 'string', example: 'Data vendor prepayments berhasil diambil' }
                }
              }
            }
          }
        },
        ...errorResponses
      }
    }
  },
  '/vendor-prepayment/sync/{netsuite_id}': {
    get: {
      tags: ['Vendor Prepayment'],
      summary: 'Sync Vendor Prepayment by Netsuite ID',
      description: 'Memaksa sinkronisasi satu vendor prepayment berdasarkan netsuite_id dari bridge API',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'netsuite_id',
          required: true,
          schema: { type: 'string' },
          description: 'Netsuite ID dari vendor prepayment yang akan di-sync',
          example: '28015'
        }
      ],
      responses: {
        200: {
          description: 'Berhasil sync vendor prepayment dari bridge API',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/VendorPrepaymentDetail' },
                  sync_info: { type: 'object', nullable: true },
                  message: { type: 'string', example: 'Vendor prepayment netsuite_id 28015 berhasil di-sync dari bridge API' }
                }
              }
            }
          }
        },
        404: {
          description: 'Not Found - Vendor prepayment tidak ditemukan di Netsuite',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        ...errorResponses
      }
    }
  },
  '/vendor-prepayment/{id}': {
    get: {
      tags: ['Vendor Prepayment'],
      summary: 'Get Vendor Prepayment by ID',
      description: 'Mendapatkan detail vendor prepayment berdasarkan ID (UUID) atau netsuite_id dari database lokal',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'UUID atau netsuite_id dari vendor prepayment',
          example: '28015'
        }
      ],
      responses: {
        200: {
          description: 'Berhasil mendapatkan detail vendor prepayment',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/VendorPrepaymentDetail' },
                  message: { type: 'string', example: 'Detail data vendor prepayment berhasil diambil' }
                }
              }
            }
          }
        },
        404: {
          description: 'Not Found - Data vendor prepayment tidak ditemukan',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        ...errorResponses
      }
    }
  }
};

module.exports = vendorPrepaymentPaths;
