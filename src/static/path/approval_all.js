/**
 * Swagger API Path Definitions for Approval All Module
 */

const errorContent = {
  'application/json': {
    schema: { $ref: '#/components/schemas/ErrorResponse' }
  }
};

const approvalAllPaths = {
  '/approval-all': {
    post: {
      tags: ['Approval All'],
      summary: 'Approve / reject transaksi NetSuite',
      description: 'Menjalankan aksi workflow approval (approve / reject) untuk record NetSuite via bridge API `POST /api/v1/bridge/approval-all`. Response diteruskan apa adanya dari bridge.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApprovalAllRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApprovalAllResponse' }
            }
          }
        },
        400: { description: 'Validation Error', content: errorContent },
        401: { description: 'Unauthorized', content: errorContent },
        500: { description: 'Internal Server Error', content: errorContent }
      }
    }
  }
};

module.exports = approvalAllPaths;
