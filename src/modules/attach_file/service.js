const { dbNetsuite } = require('../../config/database');

const getList = async (filters, page = 1, limit = 10) => {
  const { search, netsuite_id, sort_by = 'created_at', sort_order = 'desc' } = filters;
  const offset = (page - 1) * limit;

  let query = dbNetsuite('attach_files').where(function() {
    this.whereNull('is_delete').orWhere('is_delete', false);
  });

  if (netsuite_id) {
    query = query.where({ netsuite_id });
  }

  if (search) {
    query = query.where('file_name', 'ilike', `%${search}%`);
  }

  const [{ count }] = await query.clone().count('id as count');
  const total = parseInt(count, 10);
  const totalPages = Math.ceil(total / limit);

  const items = await query.orderBy(sort_by, sort_order).limit(limit).offset(offset);

  return {
    items,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages,
    }
  };
};

const saveFileRecord = async (fileData) => {
  const [record] = await dbNetsuite('attach_files').insert(fileData).returning('*');
  return record;
};

const getFileRecordByShareUrl = async (shareUrl) => {
  const record = await dbNetsuite('attach_files')
    .where('share_url', shareUrl)
    .where(function() {
      this.whereNull('is_delete').orWhere('is_delete', false);
    })
    .first();
  return record;
};

const getFileRecordById = async (id) => {
  const record = await dbNetsuite('attach_files')
    .where('id', id)
    .where(function() {
      this.whereNull('is_delete').orWhere('is_delete', false);
    })
    .first();
  return record;
};

const updateFileRecord = async (id, updateData) => {
  updateData.updated_at = new Date();
  const [record] = await dbNetsuite('attach_files')
    .where({ id })
    .update(updateData)
    .returning('*');
  return record;
};

const deleteFileRecord = async (id) => {
  const [record] = await dbNetsuite('attach_files')
    .where({ id })
    .update({ 
      is_delete: true, 
      deleted_at: new Date() 
    })
    .returning('*');
  return record;
};

const getPurchaseOrderByPoId = async (poId) => {
  const record = await dbNetsuite('purchase_orders')
    .where('po_id', poId)
    .first();
  return record;
};

module.exports = {
  getList,
  saveFileRecord,
  getFileRecordByShareUrl,
  getFileRecordById,
  updateFileRecord,
  deleteFileRecord,
  getPurchaseOrderByPoId
};
