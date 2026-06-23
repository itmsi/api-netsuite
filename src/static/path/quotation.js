/**
 * Swagger Paths for Quotation Module
 */

const quotationPaths = {
  '/quotation/get': {
    post: {
      tags: ['Quotation'],
      summary: 'Get Quotations List',
      description: 'Mendapatkan daftar quotation dari database lokal (bridge_sanbox) dengan pagination, sorting, dan filtering',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/QuotationListRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Berhasil mendapatkan daftar quotation',
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
                        items: { $ref: '#/components/schemas/Quotation' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer', example: 1 },
                          limit: { type: 'integer', example: 10 },
                          total: { type: 'integer', example: 50 },
                          totalPages: { type: 'integer', example: 5 }
                        }
                      }
                    }
                  },
                  message: { type: 'string', example: 'Data quotations berhasil diambil' }
                }
              }
            }
          }
        },
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
      }
    }
  },
  '/quotation/{id}': {
    get: {
      tags: ['Quotation'],
      summary: 'Get Quotation by ID',
      description: 'Mendapatkan detail data quotation berdasarkan ID (UUID) atau netsuite_id dari database lokal',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'UUID atau netsuite_id dari quotation'
        }
      ],
      responses: {
        200: {
          description: 'Berhasil mendapatkan detail quotation',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Quotation' },
                  message: { type: 'string', example: 'Detail data quotation berhasil diambil' }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Token tidak valid atau tidak ada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        404: {
          description: 'Not Found - Data quotation tidak ditemukan',
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
  '/quotation/sync/{netsuite_id}': {
    get: {
      tags: ['Quotation'],
      summary: 'Sync Quotation by Netsuite ID',
      description: 'Memaksa sinkronisasi satu quotation berdasarkan netsuite_id dari bridge API',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'netsuite_id',
          required: true,
          schema: {
            type: 'integer'
          },
          description: 'Netsuite ID dari quotation yang akan di-sync'
        }
      ],
      responses: {
        200: {
          description: 'Berhasil sync quotation dari bridge API',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Quotation' },
                  sync_info: {
                    type: 'object',
                    nullable: true
                  },
                  message: { type: 'string', example: 'Quotation netsuite_id 12345 berhasil di-sync dari bridge API' }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Token tidak valid atau tidak ada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        404: {
          description: 'Not Found - Quotation tidak ditemukan di Netsuite',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        500: {
          description: 'Internal Server Error atau kegagalan dari bridge API',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/quotation/create': {
    post: {
      tags: ['Quotation'],
      summary: 'Create a new quotation',
      description: 'Membuat quotation baru menggunakan Outbox Pattern (diantrikan untuk diproses ke NetSuite)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/QuotationCreateRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Quotation berhasil diantrikan',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Quotation is being processed' },
                  data: {
                    type: 'object',
                    properties: {
                      quotationId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                      event_id: { type: 'integer', example: 456 }
                    }
                  }
                }
              }
            }
          }
        },
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
      }
    }
  },
  '/quotation/update': {
    put: {
      tags: ['Quotation'],
      summary: 'Update an existing quotation',
      description: 'Mengupdate quotation yang sudah ada menggunakan Outbox Pattern',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/QuotationUpdateRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Quotation update berhasil diantrikan',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Quotation update is being processed' },
                  data: {
                    type: 'object',
                    properties: {
                      quotationId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                      event_id: { type: 'integer', example: 457 }
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Token tidak valid atau tidak ada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        404: {
          description: 'Quotation tidak ditemukan secara lokal',
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

module.exports = quotationPaths;
