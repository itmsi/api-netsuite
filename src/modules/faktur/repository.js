const { pgCore: db } = require('../../config/database');

const TABLE_NAME = 'fakturs';
const DETAILS_TABLE = 'faktur_details';

/**
 * Repository Layer - Database Operations
 */

/**
 * Find all items with pagination, search, and sorting
 */
const findAll = async (params) => {
  const { page = 1, limit = 10, search = '', sort_by = 'created_at', sort_order = 'desc' } = params;
  const offset = (page - 1) * limit;
  
  let query = db(TABLE_NAME).where({ is_delete: false });

  if (search) {
    query = query.where((builder) => {
      builder.where('nama_pembeli', 'ilike', `%${search}%`)
             .orWhere('referensi', 'ilike', `%${search}%`)
             .orWhere('nomor_dokumen_pembeli', 'ilike', `%${search}%`);
    });
  }

  const data = await query.clone()
    .select('*')
    .orderBy(sort_by, sort_order)
    .limit(limit)
    .offset(offset);
    
  const total = await query.clone()
    .count('faktur_id as count')
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
 * Find single item by ID with details join
 */
const findById = async (id) => {
  const faktur = await db(TABLE_NAME)
    .where({ faktur_id: id, is_delete: false })
    .first();
    
  if (faktur) {
    faktur.details = await db(DETAILS_TABLE)
      .where({ faktur_id: id });
  }
  
  return faktur;
};

/**
 * Create new faktur with details
 */
const create = async (data, details = []) => {
  return await db.transaction(async (trx) => {
    const [faktur] = await trx(TABLE_NAME)
      .insert({
        ...data,
        is_delete: false,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning('*');

    if (details && details.length > 0) {
      const detailsToInsert = details.map(detail => ({
        ...detail,
        faktur_id: faktur.faktur_id
      }));
      
      faktur.details = await trx(DETAILS_TABLE)
        .insert(detailsToInsert)
        .returning('*');
    }
    
    return faktur;
  });
};

/**
 * Update existing faktur
 */
const update = async (id, data, details = []) => {
  return await db.transaction(async (trx) => {
    const [faktur] = await trx(TABLE_NAME)
      .where({ faktur_id: id, is_delete: false })
      .update({
        ...data,
        updated_at: db.fn.now()
      })
      .returning('*');

    if (faktur && details && details.length > 0) {
      // Simple approach: delete existing details and re-insert
      await trx(DETAILS_TABLE).where({ faktur_id: id }).del();
      
      const detailsToInsert = details.map(detail => ({
        ...detail,
        faktur_id: id
      }));
      
      faktur.details = await trx(DETAILS_TABLE)
        .insert(detailsToInsert)
        .returning('*');
    }
    
    return faktur;
  });
};

/**
 * Soft delete faktur
 */
const remove = async (id, deletedBy) => {
  const [result] = await db(TABLE_NAME)
    .where({ faktur_id: id, is_delete: false })
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
