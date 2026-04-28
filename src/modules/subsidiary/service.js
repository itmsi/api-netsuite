const repository = require('./repository');

/**
 * Service Layer - Business Logic for Subsidiary
 */

const getList = async (params) => {
  return await repository.findAll(params);
};

const getById = async (id) => {
  const data = await repository.findById(id);
  if (!data) {
    throw { message: 'Data subsidiary tidak ditemukan', statusCode: 404 };
  }
  return data;
};

const create = async (payload) => {
  return await repository.create(payload);
};

const update = async (id, payload) => {
  const result = await repository.update(id, payload);
  if (!result) {
    throw { message: 'Data subsidiary tidak ditemukan', statusCode: 404 };
  }
  return result;
};

const remove = async (id, userId) => {
  const result = await repository.remove(id, userId);
  if (!result) {
    throw { message: 'Data subsidiary tidak ditemukan', statusCode: 404 };
  }
  return result;
};

module.exports = {
  getList,
  getById,
  create,
  update,
  remove
};
