const repository = require('./repository');

/**
 * Service Layer - Business Logic
 *
 * Layer ini menangani semua business logic.
 * Controller memanggil service, service memanggil repository.
 */

/**
 * Get all item_types with pagination, search, and sorting
 */
const getItemTypeList = async (body) => {
  return await repository.findAll({
    page: parseInt(body.page) || 1,
    limit: parseInt(body.limit) || 10,
    search: body.search || '',
    sort_by: body.sort_by || 'created_at',
    sort_order: body.sort_order || 'desc'
  });
};

/**
 * Get single item_type by ID
 */
const getItemTypeById = async (id) => {
  const data = await repository.findById(id);
  if (!data) {
    throw { message: 'Data item type tidak ditemukan', statusCode: 404 };
  }
  return data;
};

/**
 * Create new item_type
 * created_by dan updated_by otomatis dari token (userId)
 */
const createItemType = async (body, userId) => {
  const data = {
    netsuite_id: body.netsuite_id || null,
    code: body.code,
    name: body.name,
    created_by: userId,
    updated_by: userId
  };
  return await repository.create(data);
};

/**
 * Update existing item_type
 * updated_by otomatis dari token (userId)
 */
const updateItemType = async (id, body, userId) => {
  const existing = await repository.findById(id);
  if (!existing) {
    throw { message: 'Data item type tidak ditemukan', statusCode: 404 };
  }

  const data = {};
  if (body.netsuite_id !== undefined) data.netsuite_id = body.netsuite_id;
  if (body.code !== undefined) data.code = body.code;
  if (body.name !== undefined) data.name = body.name;
  data.updated_by = userId;

  return await repository.update(id, data);
};

/**
 * Soft delete item_type
 * deleted_by otomatis dari token (userId)
 */
const deleteItemType = async (id, userId) => {
  const existing = await repository.findById(id);
  if (!existing) {
    throw { message: 'Data item type tidak ditemukan', statusCode: 404 };
  }
  return await repository.remove(id, userId);
};

module.exports = {
  getItemTypeList,
  getItemTypeById,
  createItemType,
  updateItemType,
  deleteItemType
};
