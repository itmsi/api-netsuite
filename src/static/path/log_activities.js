/**
 * Swagger API Path Definitions for Log Activities Module
 */

const errorContent = {
  'application/json': {
    schema: { $ref: '#/components/schemas/ErrorResponse' }
  }
};

const logActivitiesPaths = {
  '/log-activities/get': {
    post: {
      tags: ['Log Activities'],
      summary: 'Get list of log activities',
      description: 'Fetch log activities dengan pagination dari database bridge. `type_data` apps mengambil dari tabel log_activities (filter client_id), netsuite (default) dari tabel log_activities_netsuite (filter created_by). `client` (default ITI) dicocokkan ke api_clients.name. `start_date`/`end_date` memfilter kolom created_at. `function_name` memfilter kolom url (apps) atau function (netsuite). `aggregate_id`, `aggregate_type`, `code` hanya berlaku untuk netsuite. Untuk apps, log dengan url `/api/v1/bridge/log_activities/get` tidak ditampilkan.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LogActivitiesRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LogActivitiesListResponse' }
            }
          }
        },
        400: { description: 'Bad Request (type_data / client / format tanggal tidak valid)', content: errorContent },
        401: { description: 'Unauthorized', content: errorContent },
        404: { description: 'Client tidak ditemukan di api_clients', content: errorContent },
        500: { description: 'Internal Server Error', content: errorContent }
      }
    }
  },
  '/log-activities/{id}': {
    get: {
      tags: ['Log Activities'],
      summary: 'Get log activity by id',
      description: 'Ambil detail satu log activity berdasarkan id. `type_data` apps mengambil dari tabel log_activities, netsuite (default) dari tabel log_activities_netsuite. Nama client diambil dari api_clients.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID log activity',
          schema: { type: 'string' },
          example: '1'
        },
        {
          name: 'type_data',
          in: 'query',
          required: false,
          description: 'apps -> log_activities, netsuite -> log_activities_netsuite',
          schema: { type: 'string', enum: ['apps', 'netsuite'], default: 'netsuite' }
        }
      ],
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LogActivityDetailResponse' }
            }
          }
        },
        400: { description: 'Bad Request (type_data tidak valid)', content: errorContent },
        401: { description: 'Unauthorized', content: errorContent },
        404: { description: 'Log activity tidak ditemukan', content: errorContent },
        500: { description: 'Internal Server Error', content: errorContent }
      }
    }
  }
};

module.exports = logActivitiesPaths;
