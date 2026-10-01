/**
 * Swagger Schema Definitions for Log Activities Module
 */

const logActivitiesSchemas = {
  LogActivitiesRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      limit: { type: 'integer', default: 10, example: 10 },
      sort_by: { type: 'string', default: 'created_at', example: 'created_at', description: 'apps: created_at, url | netsuite: created_at, updated_at, url, function' },
      sort_order: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC', example: 'DESC' },
      search: { type: 'string', default: '', example: '', description: 'Cari di kolom url (dan function untuk netsuite)' },
      type_data: { type: 'string', enum: ['apps', 'netsuite'], default: 'netsuite', example: 'apps', description: 'apps -> log_activities, netsuite -> log_activities_netsuite' },
      client: { type: 'string', enum: ['ITI', 'MSI'], default: 'ITI', example: 'ITI', description: 'Nama client di api_clients' },
      start_date: { type: 'string', nullable: true, example: '2026-09-29 00:00:00.000 +0700', description: 'Filter created_at >= start_date. Format yyyy-MM-dd HH:mm:ss.SSS Z' },
      end_date: { type: 'string', nullable: true, example: '2026-09-29 23:59:59.999 +0700', description: 'Filter created_at <= end_date. Format yyyy-MM-dd HH:mm:ss.SSS Z' },
      module_name: {
        oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
        nullable: true,
        example: 'customers get',
        description: 'Khusus type_data apps (exact, case-insensitive). Boleh string atau array. Daftar nilai dari POST /log-activities/module-names. Untuk netsuite selalu kosong'
      },
      function_name: { type: 'string', nullable: true, example: 'SalesOrder', description: 'Filter contains (case-insensitive). apps -> kolom url, netsuite -> kolom function' },
      aggregate_id: { type: 'string', nullable: true, example: '93040', description: 'Khusus type_data netsuite (exact match). Diabaikan untuk apps' },
      aggregate_type: { type: 'string', nullable: true, example: 'sales_order', description: 'Khusus type_data netsuite (exact match). Diabaikan untuk apps' },
      code: { type: 'string', nullable: true, example: '', description: 'Khusus type_data netsuite (exact match). Diabaikan untuk apps' }
    }
  },
  LogActivityItem: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '1', description: 'ID log activity (dipakai untuk GET /log-activities/{id})' },
      client: { type: 'string', example: 'ITI' },
      type_data: { type: 'string', example: 'apps' },
      url: { type: 'string', example: '/api/v1/bridge/sales-orders/get' },
      module_name: { type: 'string', nullable: true, example: 'sales-orders get', description: 'Diturunkan dari url + method sesuai BRIDGE_ROUTES.md. null jika url tidak terdaftar atau type_data netsuite' },
      function_name: { type: 'string', example: '/api/v1/bridge/sales-orders/get', description: 'netsuite: kolom function | apps: kolom url' },
      payload: { type: 'object', nullable: true, description: 'Payload request (jsonb)' },
      response: { type: 'object', nullable: true, description: 'Response (jsonb)' },
      created_at: { type: 'string', example: '2026-09-29 08:46:36.250 +0700' },
      updated_at: { type: 'string', nullable: true, example: '2026-09-29 08:46:36.250 +0700', description: 'Selalu null untuk apps (log_activities tidak punya kolom updated_at)' }
    }
  },
  LogActivitiesListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/LogActivityItem' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      message: { type: 'string', example: 'Data log activities berhasil diambil' }
    }
  },
  LogActivityModuleNamesRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1, example: 1 },
      limit: { type: 'integer', default: 10, example: 10 },
      sort_by: { type: 'string', example: 'module_name', description: 'module_name / url. Selain itu urutan sesuai BRIDGE_ROUTES.md' },
      sort_order: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC', example: 'ASC' },
      search: { type: 'string', default: '', example: '', description: 'Cari (contains, case-insensitive) di module_name / url' }
    }
  },
  LogActivityModuleNamesResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                module_name: { type: 'string', example: 'customers get' },
                url: { type: 'string', example: '/api/v1/bridge/customers/get' }
              }
            }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      },
      message: { type: 'string', example: 'Data module name berhasil diambil' }
    }
  },
  LogActivityDetailResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: { $ref: '#/components/schemas/LogActivityItem' },
      message: { type: 'string', example: 'Data log activity berhasil diambil' }
    }
  }
};

module.exports = logActivitiesSchemas;
