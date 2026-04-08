/**
 * Swagger API Path Definitions for Department Module
 */

const departmentPaths = {
  '/departments/get-list': {
    post: {
      tags: ['Departments'],
      summary: 'Get list of departments',
      description: 'Fetch departments data from external bridge API with pagination/search support',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DepartmentRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DepartmentListResponse' }
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

module.exports = departmentPaths;
