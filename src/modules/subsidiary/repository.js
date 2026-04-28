const { pgCore: db } = require('../../config/database');

const TABLE_NAME = 'npwp_inlines';

/**
 * Repository Layer - Database Operations for Subsidiary (npwp_inlines)
 */

/**
 * Find all subsidiaries with pagination, search, and sorting
 */
const findAll = async (params) => {
  const { page = 1, limit = 10, search = '', sort_by = 'created_at', sort_order = 'desc' } = params;
  const offset = (page - 1) * limit;
  
  let query = db(TABLE_NAME).where({ is_delete: false });

  if (search) {
    query = query.where((builder) => {
      builder.where('company_name', 'ilike', `%${search}%`)
             .orWhere('abbreviation', 'ilike', `%${search}%`)
             .orWhere('nomor', 'ilike', `%${search}%`)
             .orWhere('nitku', 'ilike', `%${search}%`);
    });
  }

  const data = await query.clone()
    .select('*')
    .orderBy(sort_by, sort_order)
    .limit(limit)
    .offset(offset);
    
  const total = await query.clone()
    .count('id as count')
    .first();
    
  return {
    items: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total.count),
      totalPages: Math.ceil(total.count / limit)
    }
  };
};

/**
 * Find single subsidiary by ID
 */
const findById = async (id) => {
  return await db(TABLE_NAME)
    .where({ id: id, is_delete: false })
    .first();
};

/**
 * Create new subsidiary
 */
const create = async (data) => {
  const [result] = await db(TABLE_NAME)
    .insert({
      ...data,
      is_delete: false,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    })
    .returning('*');
    
  return result;
};

/**
 * Update existing subsidiary
 */
const update = async (id, data) => {
  const [result] = await db(TABLE_NAME)
    .where({ id: id, is_delete: false })
    .update({
      ...data,
      updated_at: db.fn.now()
    })
    .returning('*');
    
  return result;
};

/**
 * Soft delete subsidiary
 */
const remove = async (id, deletedBy) => {
  const [result] = await db(TABLE_NAME)
    .where({ id: id, is_delete: false })
    .update({
      is_delete: true,
      deleted_at: db.fn.now(),
      deleted_by: deletedBy
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
