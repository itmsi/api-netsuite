const repository = require('./repository');

/**
 * Service Layer - Business Logic
 */

const getList = async (params) => {
  return await repository.findAll(params);
};

const getById = async (id) => {
  const data = await repository.findById(id);
  if (!data) {
    const error = new Error('Data reference tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  return data;
};

const create = async (data) => {
  return await repository.create(data);
};

const update = async (id, data) => {
  const existing = await repository.findById(id);
  if (!existing) {
    const error = new Error('Data reference tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  return await repository.update(id, data);
};

const remove = async (id, userId) => {
  const existing = await repository.findById(id);
  if (!existing) {
    const error = new Error('Data reference tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  return await repository.remove(id, userId);
};

module.exports = {
  getList,
  getById,
  create,
  update,
  remove
};
