const { pgCore } = require('../../config/database');

const TABLE_NAME = 'syncs';

/**
 * Repository Layer - Database Operations
 *
 * Layer ini menangani semua operasi database menggunakan Knex Query Builder.
 * Tidak ada business logic di sini, hanya CRUD operations.
 */

/**
 * Find all syncs - return data terbaru per sync_module (GROUP BY sync_module, ambil MAX sync_id)
 */
const findAll = async ({ page = 1, limit = 10, search = '', sort_by = 'sync_id', sort_order = 'desc' }) => {
  const offset = (page - 1) * limit;

  const validSortColumns = ['sync_id', 'sync_module', 'sync_status', 'created_at', 'updated_at'];
  const orderCol = validSortColumns.includes(sort_by) ? sort_by : 'sync_id';
  const orderDir = sort_order.toLowerCase() === 'asc' ? 'asc' : 'desc';

  // Subquery: ambil sync_id terbesar (terbaru) per sync_module
  const latestSubquery = pgCore(TABLE_NAME)
    .select(pgCore.raw('MAX(sync_id) as max_sync_id'))
    .where('is_delete', false)
    .groupBy('sync_module')
    .as('latest');

  // Base query: join ke subquery agar hanya row terbaru per module yang keluar
  let baseQuery = pgCore(TABLE_NAME)
    .join(latestSubquery, `${TABLE_NAME}.sync_id`, 'latest.max_sync_id')
    .where(`${TABLE_NAME}.is_delete`, false);

  if (search) {
    baseQuery = baseQuery.where(function () {
      this.whereILike(`${TABLE_NAME}.sync_module`, `%${search}%`)
        .orWhereILike(`${TABLE_NAME}.sync_status`, `%${search}%`);
    });
  }

  const countResult = await baseQuery.clone().count(`${TABLE_NAME}.sync_id as total`).first();
  const total = parseInt(countResult.total) || 0;
  const totalPages = Math.ceil(total / limit);

  const items = await baseQuery
    .clone()
    .select([
      `${TABLE_NAME}.sync_id`,
      `${TABLE_NAME}.sync_module`,
      `${TABLE_NAME}.sync_status`,
      `${TABLE_NAME}.created_at`,
      `${TABLE_NAME}.created_by`,
      `${TABLE_NAME}.updated_at`,
      `${TABLE_NAME}.updated_by`,
      `${TABLE_NAME}.is_delete`
    ])
    .orderBy(`${TABLE_NAME}.${orderCol}`, orderDir)
    .limit(limit)
    .offset(offset);

  return {
    items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages
    }
  };
};

/**
 * Find single sync by ID
 */
const findById = async (id) => {
  return await pgCore(TABLE_NAME)
    .where({ sync_id: id, is_delete: false })
    .first();
};

/**
 * Create new sync record
 */
const create = async (data) => {
  const [result] = await pgCore(TABLE_NAME)
    .insert({
      ...data,
      is_delete: false,
      created_at: pgCore.fn.now(),
      updated_at: pgCore.fn.now()
    })
    .returning('*');
  return result;
};

/**
 * Update existing sync record
 */
const update = async (id, data) => {
  const [result] = await pgCore(TABLE_NAME)
    .where({ sync_id: id, is_delete: false })
    .update({
      ...data,
      updated_at: pgCore.fn.now()
    })
    .returning('*');
  return result;
};

/**
 * Soft delete sync record
 */
const remove = async (id, deletedBy) => {
  const [result] = await pgCore(TABLE_NAME)
    .where({ sync_id: id, is_delete: false })
    .update({
      is_delete: true,
      deleted_at: pgCore.fn.now(),
      deleted_by: deletedBy || null
    })
    .returning('*');
  return result;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};
