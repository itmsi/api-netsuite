const repository = require('./repository');

/**
 * Service Layer - Business Logic
 *
 * Controller hanya memanggil service, dan service yang memanggil repository.
 */

/**
 * Get all syncs with pagination, search, and sorting
 */
const getSyncList = async (body) => {
  return await repository.findAll({
    page: parseInt(body.page) || 1,
    limit: parseInt(body.limit) || 10,
    search: body.search || '',
    sort_by: body.sort_by || 'created_at',
    sort_order: body.sort_order || 'desc'
  });
};

/**
 * Get single sync by ID
 */
const getSyncById = async (id) => {
  const data = await repository.findById(id);

  if (!data) {
    throw { message: 'Data sync tidak ditemukan', statusCode: 404 };
  }

  return data;
};

/**
 * Create new sync record
 */
const createSync = async (body, user) => {
  const userId = user?.employee_id || user?.user_id || user?.sub || null;

  const data = {
    sync_module: body.sync_module || null,
    sync_status: body.sync_status || null,
    created_by: userId,
    updated_by: userId
  };

  return await repository.create(data);
};

/**
 * Update existing sync record
 */
const updateSync = async (id, body, user) => {
  const existing = await repository.findById(id);
  if (!existing) {
    throw { message: 'Data sync tidak ditemukan', statusCode: 404 };
  }

  const userId = user?.employee_id || user?.user_id || user?.sub || null;

  const data = {};
  if (body.sync_module !== undefined) data.sync_module = body.sync_module;
  if (body.sync_status !== undefined) data.sync_status = body.sync_status;
  data.updated_by = userId;

  return await repository.update(id, data);
};

/**
 * Soft delete sync record
 */
const deleteSync = async (id, user) => {
  const existing = await repository.findById(id);
  if (!existing) {
    throw { message: 'Data sync tidak ditemukan', statusCode: 404 };
  }

  const userId = user?.employee_id || user?.user_id || user?.sub || null;
  return await repository.remove(id, userId);
};

/**
 * Get latest sync info for a module (with employee name)
 */
const getLatestSyncInfo = async (syncModule) => {
  const data = await repository.findLatestByModuleWithEmployee(syncModule);
  if (!data) return null;
  return {
    sync_status: data.sync_status,
    created_at: data.created_at,
    created_by_name: data.created_by_name || null
  };
};

/**
 * Sync specific module (trigger background process)
 */
const syncModules = async (body, user) => {
  const { module: moduleName } = body;
  if (!moduleName) {
    throw { message: 'Parameter module tidak boleh kosong', statusCode: 400 };
  }

  // 1. Check if sync is already onproses
  const existingSync = await repository.findByModuleAndStatus(moduleName, 'onproses');
  if (existingSync) {
    throw { message: 'Sync sedang berjalan', statusCode: 400 };
  }

  const userId = user?.employee_id || user?.user_id || user?.sub || null;

  // 2. Create sync record with onproses status
  const syncData = {
    sync_module: moduleName,
    sync_status: 'onproses',
    created_by: userId,
    updated_by: userId
  };
  const createdSync = await repository.create(syncData);

  // 3. Trigger RabbitMQ queue
  const { publishToRabbitMqQueueSingle } = require('../../config/rabbitmq');
  const { EXCHANGES, QUEUE } = require('../../utils/constant');

  await publishToRabbitMqQueueSingle(
    EXCHANGES.SYNC_MODULE,
    QUEUE.SYNC_MODULE,
    {
      sync_id: createdSync.sync_id,
      module: moduleName,
      user: user
    }
  );

  return createdSync;
};

module.exports = {
  getSyncList,
  getSyncById,
  createSync,
  updateSync,
  deleteSync,
  getLatestSyncInfo,
  syncModules
};
