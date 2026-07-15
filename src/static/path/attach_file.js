const attachFilePaths = {
  '/attach_file/get': {
    post: {
      tags: ['Attach File'],
      summary: 'Get list of attach files',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                sort_by: { type: 'string', example: 'created_at' },
                sort_order: { type: 'string', example: 'desc' },
                search: { type: 'string', example: '' },
                netsuite_id: { type: 'string', example: '' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AttachFileResponse' }
            }
          }
        }
      }
    }
  },
  '/attach_file': {
    post: {
      tags: ['Attach File'],
      summary: 'Upload an attach file',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                file: { type: 'string', format: 'binary' },
                file_name: { type: 'string' },
                netsuite_id: { type: 'string' },
                created_by_api: { type: 'string', description: 'Email/identifier dari pembuat file. Jika tidak diisi, diambil otomatis dari token.' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Successful upload',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AttachFileUploadResponse' }
            }
          }
        }
      }
    }
  },
  '/attach_file/{id}': {
    put: {
      tags: ['Attach File'],
      summary: 'Update an attach file',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                fileUrl: { type: 'string' },
                file: { type: 'string', format: 'binary' },
                file_name: { type: 'string' },
                netsuite_id: { type: 'string' },
                created_by_api: { type: 'string', description: 'Email/identifier dari pembuat file. Jika tidak diisi, diambil otomatis dari token.' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Successful update',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AttachFileUploadResponse' }
            }
          }
        }
      }
    }
  },
  '/attach_file/{id}/{netsuite_id}': {
    delete: {
      tags: ['Attach File'],
      summary: 'Delete an attach file',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        },
        {
          name: 'netsuite_id',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: {
          description: 'Successful deletion',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AttachFileDeleteResponse' }
            }
          }
        }
      }
    }
  }
};

module.exports = attachFilePaths;
