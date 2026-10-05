/**
 * Swagger API Path Definitions for Netsuite Scripts Module
 */

const errorContent = {
  'application/json': {
    schema: { $ref: '#/components/schemas/ErrorResponse' }
  }
};

const netsuiteScriptsPaths = {
  '/netsuite_scripts/get': {
    post: {
      tags: ['Netsuite Scripts'],
      summary: 'Get list of netsuite scripts',
      description: 'Ambil data tabel netsuite_scripts dari database bridge dengan pagination. Response hanya `module` dan `script_id`. `search` mencari (contains, case-insensitive) di kolom module dan script_id.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/NetsuiteScriptsRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NetsuiteScriptsListResponse' }
            }
          }
        },
        401: { description: 'Unauthorized', content: errorContent },
        500: { description: 'Internal Server Error', content: errorContent }
      }
    }
  }
};

module.exports = netsuiteScriptsPaths;
