const repository = require('./repository');

/**
 * Service Layer - Business Logic
 * 
 * Layer ini menangani semua business logic dan aturan bisnis.
 * Controller hanya memanggil service, dan service yang memanggil repository.
 */

/**
 * Get all items with pagination
 */
const getAllItems = async (page = 1, limit = 10) => {
  return await repository.findAll(page, limit);
};

/**
 * Get single item by ID
 */
const getItemById = async (id) => {
  const data = await repository.findById(id);
  
  if (!data) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }
  
  return data;
};

/**
 * Create new item
 */
const createItem = async (itemData) => {
  return await repository.create(itemData);
};

/**
 * Update existing item
 */
const updateItem = async (id, itemData) => {
  // Check if item exists
  const existingItem = await repository.findById(id);
  
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }
  
  return await repository.update(id, itemData);
};

/**
 * Soft delete item
 */
const deleteItem = async (id) => {
  // Check if item exists
  const existingItem = await repository.findById(id);
  
  if (!existingItem) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }
  
  const result = await repository.remove(id);
  return result;
};

/**
 * Restore soft deleted item
 */
const restoreItem = async (id) => {
  const data = await repository.restore(id);
  
  if (!data) {
    throw { message: 'Data tidak ditemukan', statusCode: 404 };
  }
  
  return data;
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  restoreItem
};

