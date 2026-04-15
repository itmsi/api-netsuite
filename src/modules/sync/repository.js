const { pgCore } = require('../../config/database');

const TABLE_NAME = 'syncs';

/**
 * Repository Layer - Database Operations
 *
 * Layer ini menangani semua operasi database menggunakan Knex Query Builder.
 * Tidak ada business logic di sini, hanya CRUD operations.
 */

/**
 * Find all syncs with pagination and optional search/sort
 */
const findAll = async ({ page = 1, limit = 10, search = '', sort_by = 'created_at', sort_order = 'desc' }) => {
  const offset = (page - 1) * limit;

  const validSortColumns = ['sync_id', 'sync_module', 'sync_status', 'created_at', 'updated_at'];
  const orderCol = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
  const orderDir = sort_order.toLowerCase() === 'asc' ? 'asc' : 'desc';

  let query = pgCore(TABLE_NAME).where('is_delete', false);

  if (search) {
    query = query.where(function () {
      this.whereILike('sync_module', `%${search}%`)
        .orWhereILike('sync_status', `%${search}%`);
    });
  }

  const countResult = await query.clone().count('sync_id as total').first();
  const total = parseInt(countResult.total) || 0;
  const totalPages = Math.ceil(total / limit);

  const items = await query
    .clone()
    .select([
      'sync_id',
      'sync_module',
      'sync_status',
      'created_at',
      'created_by',
      'updated_at',
      'updated_by',
      'is_delete'
    ])
    .orderBy(orderCol, orderDir)
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
