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
  //if (body.sync_module !== undefined) data.sync_module = body.sync_module;
  if (body.sync_status !== undefined) data.sync_status = body.sync_status;
  if (body.count_data !== undefined) data.count_data = body.count_data;
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
    created_at: data.updated_at,
    created_by_name: data.updated_by_name || null
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

  const userId = user?.employee_id || user?.user_id || user?.sub || null;

  let sync_id;
  let return_data;
  // 1. Check if sync is already onproses
  const existingSync = await repository.findByModuleAndStatus(moduleName);
  if (existingSync) { //jika ada maka cek statusnya apakah onproses atau bukan
    if (existingSync.sync_status === 'onproses') { //jika onproses maka tidak bisa sync
      throw { message: 'Sync sedang berjalan', statusCode: 400 };
    } else { //jika bukan onproses maka bisa sync
      const syncData = {
        sync_status: 'onproses',
        updated_by: userId,
        created_by: userId
      };
      await repository.update(existingSync.sync_id, syncData);
    }
    sync_id = existingSync.sync_id;
    return_data = existingSync;
  } else { //jika tidak ada maka buat sync record baru

    // 2. Create sync record with onproses status
    const syncData = {
      sync_module: moduleName,
      sync_status: 'onproses',
      created_by: userId,
      updated_by: userId
    };
    const createdSync = await repository.create(syncData);
    sync_id = createdSync.sync_id;
    return_data = createdSync;
  }

  // 3. Trigger RabbitMQ queue
  const { publishToRabbitMqQueueSingle } = require('../../config/rabbitmq');
  const { EXCHANGES, QUEUE } = require('../../utils/constant');

  await publishToRabbitMqQueueSingle(
    EXCHANGES.SYNC_MODULE,
    QUEUE.SYNC_MODULE,
    {
      sync_id: sync_id,
      module: moduleName,
      user: user
    }
  );

  return return_data;
};

/**
 * Upsert sync record (Check if exists by module, then update or create)
 */
const upsertSync = async (body, user) => {
  const { sync_module } = body;
  if (!sync_module) {
    throw { message: 'Parameter sync_module tidak boleh kosong', statusCode: 400 };
  }

  const existing = await repository.findByModuleAndStatus(sync_module);

  if (existing) {
    return await updateSync(existing.sync_id, body, user);
  } else {
    return await createSync(body, user);
  }
};

module.exports = {
  getSyncList,
  getSyncById,
  createSync,
  updateSync,
  upsertSync,
  deleteSync,
  getLatestSyncInfo,
  syncModules
};
