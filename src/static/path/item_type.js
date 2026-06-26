/**
 * Swagger API Path Definitions for Item Type Module
 */

const itemTypePaths = {
  '/item_type/get': {
    post: {
      tags: ['Item Type'],
      summary: 'Get list of Item Type',
      description: 'Ambil data item type dengan pagination, search, dan sorting',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                page: { type: 'integer', default: 1, example: 1, description: 'Nomor halaman' },
                limit: { type: 'integer', default: 10, example: 10, description: 'Jumlah data per halaman' },
                search: { type: 'string', example: '', description: 'Kata kunci pencarian (code, name, netsuite_id)' },
                sort_by: { type: 'string', default: 'created_at', example: 'created_at', description: 'Kolom pengurutan' },
                sort_order: { type: 'string', default: 'desc', example: 'desc', enum: ['asc', 'desc', 'ASC', 'DESC'], description: 'Arah pengurutan' }
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
              schema: { $ref: '#/components/schemas/ItemTypeListResponse' }
            }
          }
        },
        401: {
          description: 'Unauthorized - Token tidak valid atau tidak ada'
        },
        500: {
          description: 'Internal Server Error'
        }
      }
    }
  },
  '/item_type/create': {
    post: {
      tags: ['Item Type'],
      summary: 'Create Item Type',
      description: 'Buat data item type baru. created_by dan updated_by otomatis dari token.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ItemTypeInput' }
          }
        }
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ItemTypeDetailResponse' }
            }
          }
        },
        400: {
          description: 'Validation Error'
        },
        401: {
          description: 'Unauthorized - Token tidak valid atau tidak ada'
        },
        500: {
          description: 'Internal Server Error'
        }
      }
    }
  },
  '/item_type/{id}': {
    get: {
      tags: ['Item Type'],
      summary: 'Get Item Type by ID',
      description: 'Ambil detail item type berdasarkan ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID item type',
          schema: { type: 'integer', example: 1 }
        }
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ItemTypeDetailResponse' }
            }
          }
        },
        401: {
          description: 'Unauthorized - Token tidak valid atau tidak ada'
        },
        404: {
          description: 'Data tidak ditemukan'
        }
      }
    },
    put: {
      tags: ['Item Type'],
      summary: 'Update Item Type',
      description: 'Update data item type. updated_by otomatis dari token.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID item type',
          schema: { type: 'integer', example: 1 }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ItemTypeUpdateInput' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ItemTypeDetailResponse' }
            }
          }
        },
        400: {
          description: 'Validation Error'
        },
        401: {
          description: 'Unauthorized - Token tidak valid atau tidak ada'
        },
        404: {
          description: 'Data tidak ditemukan'
        },
        500: {
          description: 'Internal Server Error'
        }
      }
    },
    delete: {
      tags: ['Item Type'],
      summary: 'Delete Item Type (Soft Delete)',
      description: 'Soft delete item type. deleted_by otomatis dari token. Data tidak benar-benar dihapus, hanya ditandai is_deleted=true.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID item type',
          schema: { type: 'integer', example: 1 }
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
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Data item type berhasil dihapus' }
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Token tidak valid atau tidak ada'
        },
        404: {
          description: 'Data tidak ditemukan'
        },
        500: {
          description: 'Internal Server Error'
        }
      }
    }
  }
};

module.exports = itemTypePaths;
