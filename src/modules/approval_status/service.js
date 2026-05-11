const repository = require('./repository');

const getAllItems = async (page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'desc') => {
  return await repository.findAll(page, limit, search, sortBy, sortOrder);
};

const getItemById = async (id) => {
  const data = await repository.findById(id);
  if (!data) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }
  return data;
};

const createItem = async (itemData, userId) => {
  return await repository.create({ ...itemData, created_by: userId });
};

const updateItem = async (id, itemData, userId) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }
  return await repository.update(id, { ...itemData, update_by: userId });
};

const deleteItem = async (id, userId) => {
  const existingItem = await repository.findById(id);
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }
  return await repository.remove(id, userId);
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
};
