const { dbNetsuite: db } = require('../../config/database');

const TABLE_NAME = 'item_types';

/**
 * Repository Layer - Database Operations
 *
 * Semua operasi database menggunakan Knex.js Query Builder.
 * Tidak ada raw query di sini.
 */

/**
 * Find all item_types with pagination, search, and sorting
 */
const findAll = async ({ page = 1, limit = 10, search = '', sort_by = 'created_at', sort_order = 'desc' }) => {
  const offset = (page - 1) * limit;

  // Whitelist kolom untuk sort_by agar aman dari SQL injection
  const validSortColumns = ['id', 'netsuite_id', 'code', 'name', 'created_at', 'updated_at'];
  const orderCol = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
  const orderDir = ['asc', 'desc', 'ASC', 'DESC'].includes(sort_order) ? sort_order : 'desc';

  let query = db(TABLE_NAME).where({ is_deleted: false });

  if (search) {
    query = query.where(function () {
      this.where('code', 'ilike', `%${search}%`)
        .orWhere('name', 'ilike', `%${search}%`)
        .orWhere('netsuite_id', 'ilike', `%${search}%`);
    });
  }

  const countResult = await query.clone().count('id as count').first();
  const total = parseInt(countResult.count) || 0;
  const totalPages = Math.ceil(total / limit);

  const items = await query
    .clone()
    .select([
      'id',
      'netsuite_id',
      'code',
      'name',
      'created_at',
      'created_by',
      'updated_at',
      'updated_by',
      'deleted_at',
      'deleted_by',
      'is_deleted'
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
 * Find single item_type by ID
 */
const findById = async (id) => {
  return await db(TABLE_NAME)
    .where({ id, is_deleted: false })
    .first();
};

/**
 * Create new item_type
 */
const create = async (data) => {
  const [result] = await db(TABLE_NAME)
    .insert({
      ...data,
      is_deleted: false,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    })
    .returning('*');
  return result;
};

/**
 * Update existing item_type
 */
const update = async (id, data) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_deleted: false })
    .update({
      ...data,
      updated_at: db.fn.now()
    })
    .returning('*');
  return result;
};

/**
 * Soft delete item_type
 */
const remove = async (id, deleted_by) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_deleted: false })
    .update({
      is_deleted: true,
      deleted_at: db.fn.now(),
      deleted_by: deleted_by
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
