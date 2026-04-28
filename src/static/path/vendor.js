/**
 * Swagger API Path Definitions for Vendors Module
 */

const vendorPaths = {
  '/vendor/get-list': {
    post: {
      tags: ['Vendors'],
      summary: 'Get list of vendors',
      description: 'Fetch vendors dengan pagination dari database lokal (bridge_sanbox.vendors). Data sudah tersimpan dari hasil sync sebelumnya via endpoint /sync.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/VendorRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VendorListResponse' }
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
  '/vendor/sync': {
    post: {
      tags: ['Vendors'],
      summary: 'Sync vendors dari bridge API',
      description: 'Fetch vendors langsung dari bridge API (NetSuite) dengan pagination. Format response identik dengan `/get-list`. Gunakan endpoint ini untuk mendapatkan data real-time dari NetSuite.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/VendorRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VendorListResponse' }
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
  }
};

module.exports = vendorPaths;
