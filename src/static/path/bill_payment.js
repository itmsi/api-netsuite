/**
 * Swagger API Path Definitions for Bill Payment Module
 */

const billPaymentPaths = {
  '/bill-payment/attachments-files/get': {
    post: {
      tags: ['Bill Payment'],
      summary: 'Get list of bill payment attachments',
      description: 'Fetch data attachment bill payment dari database lokal (bridge_sanbox.bills_payment_attachments).',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BillPaymentAttachmentListRequest' }
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
                        items: { $ref: '#/components/schemas/BillPaymentAttachment' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Data bill payment attachments berhasil diambil' }
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
  '/bill-payment/attachments-files/sync': {
    post: {
      tags: ['Bill Payment'],
      summary: 'Sync attachments bill payment',
      description: 'Ambil daftar attachment satu bill payment dari NetSuite via bridge API (POST /api/v1/bridge/bills-payments/attachments-files/get).',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BillPaymentAttachmentSyncRequest' }
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
                  data: { type: 'object', description: 'Response dari bridge API (header bill payment + files)' },
                  message: { type: 'string', example: 'Attachments bill payment netsuite_id 100421 berhasil di-sync dari bridge API' }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
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
  '/bill-payment/attachments-files/sync/{id}': {
    post: {
      tags: ['Bill Payment'],
      summary: 'Convert satu file attachment bill payment',
      description: 'Convert satu file attachment via bridge API (POST /api/v1/bridge/bills-payments/attachments-files/converted). File akan berstatus PENDING sampai selesai diproses worker.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'NetSuite ID bill payment',
          schema: { type: 'string', example: '100421' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BillPaymentAttachmentConvertRequest' }
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
                  data: { $ref: '#/components/schemas/BillPaymentAttachment' },
                  message: { type: 'string', example: 'File 2913 bill payment netsuite_id 100421 sedang diproses convert' }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        404: {
          description: 'Bill payment atau file tidak ditemukan di NetSuite',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
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
  '/bill-payment/attachments-files/download/{file_netsuite_id}': {
    get: {
      tags: ['Bill Payment'],
      summary: 'Download file attachment bill payment',
      description: 'Download file hasil convert berdasarkan file_netsuite_id (nilai `download_url` dari /attachments-files/get).',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'file_netsuite_id',
          in: 'path',
          required: true,
          description: 'NetSuite ID file attachment',
          schema: { type: 'string', example: '2913' }
        }
      ],
      responses: {
        200: {
          description: 'File (auto download)',
          content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } }
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        404: {
          description: 'File attachment tidak ditemukan',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        409: {
          description: 'File belum / masih dalam proses convert',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        },
        500: {
          description: 'Internal Server Error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
        }
      }
    }
  },
  '/bill-payment/get': {
    post: {
      tags: ['Bill Payment'],
      summary: 'Get list of bill payments',
      description: 'Fetch bill payments list dari database lokal (bridge_sanbox.bills_payments). Data ini tersinkronisasi dari NetSuite.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BillPaymentListRequest' }
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
                        items: { $ref: '#/components/schemas/BillPayment' }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Data bill payments berhasil diambil' }
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
  '/bill-payment/sync/{netsuite_id}': {
    get: {
      tags: ['Bill Payment'],
      summary: 'Force sync bill payment by netsuite_id',
      description: 'Fetch fresh data satu bill payment dari NetSuite via bridge API berdasarkan netsuite_id, lalu overwrite data di DB lokal.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'netsuite_id',
          in: 'path',
          required: true,
          description: 'NetSuite ID (integer) dari bill payment yang akan di-sync',
          schema: { type: 'integer', example: 24358 }
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
                  data: { $ref: '#/components/schemas/BillPayment' },
                  sync_info: {
                    type: 'object',
                    properties: {
                      lastSync: { type: 'string', format: 'date-time' },
                      status: { type: 'string', example: 'success' }
                    }
                  },
                  message: { type: 'string', example: 'Bill payment netsuite_id 24358 berhasil di-sync dari bridge API' }
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
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Bill payment tidak ditemukan di NetSuite' }
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
  '/bill-payment/{id}': {
    get: {
      tags: ['Bill Payment'],
      summary: 'Get bill payment detail by ID',
      description: 'Fetch detail satu record bill payment berdasarkan UUID dari database lokal (bridge_sanbox.bills_payments).',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'UUID dari kolom `id` atau integer dari kolom `netsuite_id`',
          schema: { type: 'string', example: 'f7b3d24b-9ddd-481c-87df-fd8fe7848ec3' }
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
                  data: { $ref: '#/components/schemas/BillPayment' },
                  message: { type: 'string', example: 'Detail data bill payment berhasil diambil' }
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
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Data bill payment tidak ditemukan' }
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

module.exports = billPaymentPaths;
