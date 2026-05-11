const { pgCore: db } = require('../../config/database');

const TABLE_NAME = 'po_status';

const findAll = async (page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'desc') => {
  const offset = (page - 1) * limit;
  
  let query = db(TABLE_NAME).where({ is_deleted: false });

  if (search) {
    query = query.where(function() {
      this.where('code', 'ilike', `%${search}%`)
          .orWhere('name', 'ilike', `%${search}%`);
    });
  }

  const data = await query.clone()
    .orderBy(sortBy, sortOrder)
    .limit(limit)
    .offset(offset);
    
  const total = await query.clone().count('id as count').first();
    
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

const findById = async (id) => {
  return await db(TABLE_NAME)
    .where({ id, is_deleted: false })
    .first();
};

const create = async (data) => {
  const [result] = await db(TABLE_NAME)
    .insert({
      ...data,
      created_at: db.fn.now()
    })
    .returning('*');
  return result;
};

const update = async (id, data) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_deleted: false })
    .update({
      ...data,
      update_at: db.fn.now()
    })
    .returning('*');
  return result;
};

const remove = async (id, update_by) => {
  const [result] = await db(TABLE_NAME)
    .where({ id, is_deleted: false })
    .update({
      is_deleted: true,
      deleted_at: db.fn.now(),
      update_by: update_by
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
