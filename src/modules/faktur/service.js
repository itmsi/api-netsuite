const repository = require('./repository');

/**
 * Service Layer - Business Logic
 */

const getList = async (params) => {
  const result = await repository.findAll(params);
  result.items = result.items.map(item => ({
    ...item,
    nomor_id_penjual: item.id_tku_Penjual ? item.id_tku_Penjual.replace(/000000$/, '') : null
  }));
  return result;
};

const getById = async (id) => {
  const data = await repository.findById(id);
  if (!data) {
    throw { message: 'Data faktur tidak ditemukan', statusCode: 404 };
  }
  
  data.nomor_id_penjual = data.id_tku_Penjual ? data.id_tku_Penjual.replace(/000000$/, '') : null;
  
  return data;
};

const create = async (payload) => {
  const { details, ...data } = payload;
  return await repository.create(data, details);
};

const update = async (id, payload) => {
  const { details, ...data } = payload;
  const result = await repository.update(id, data, details);
  if (!result) {
    throw { message: 'Data faktur tidak ditemukan', statusCode: 404 };
  }
  return result;
};

const remove = async (id, userId) => {
  const result = await repository.remove(id, userId);
  if (!result) {
    throw { message: 'Data faktur tidak ditemukan', statusCode: 404 };
  }
  return result;
};

const updateStatusBulk = async (payload) => {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw { message: 'Payload harus berupa array dan tidak boleh kosong', statusCode: 400 };
  }
  return await repository.updateStatusBulk(payload);
};

module.exports = {
  getList,
  getById,
  create,
  update,
  remove,
  updateStatusBulk
};
