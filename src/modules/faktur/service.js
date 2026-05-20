const repository = require('./repository');
const { pgCore: db } = require('../../config/database');
const { syncToFakturs } = require('../invoice_sales_order/service');

const FETCH_INVOICE_CHUNK_SIZE = parseInt(process.env.SYNC_FAKTUR_LOOKUP_CHUNK_SIZE) || 1000;

/**
 * Service Layer - Business Logic
 */

const normalizeInvoiceSalesOrderRecord = (row) => {
  let lines = row.lines;
  if (typeof lines === 'string') {
    try {
      lines = JSON.parse(lines);
    } catch {
      lines = [];
    }
  }

  if (!Array.isArray(lines)) {
    lines = [];
  }

  return {
    netsuite_id: row.netsuite_id,
    tranid: row.tranid,
    entity: row.entity,
    entityid: row.entityid,
    trandate: row.trandate,
    memo: row.memo,
    subsidiary: row.subsidiary,
    lines
  };
};

/**
 * Sync faktur dari data invoice_sales_orders lokal berdasarkan netsuite_id
 */
const syncFromInvoiceSalesOrders = async (netsuiteIds) => {
  const ids = [...new Set(netsuiteIds.map((id) => parseInt(id)).filter((id) => !isNaN(id)))];

  if (ids.length === 0) {
    throw { message: 'netsuite_id wajib diisi dan harus berupa angka', statusCode: 400 };
  }

  const rows = [];
  for (let i = 0; i < ids.length; i += FETCH_INVOICE_CHUNK_SIZE) {
    const chunkIds = ids.slice(i, i + FETCH_INVOICE_CHUNK_SIZE);
    const chunkRows = await db('invoice_sales_orders')
      .whereIn('netsuite_id', chunkIds)
      .where('is_deleted', false);
    rows.push(...chunkRows);
  }

  const foundIds = new Set(rows.map((r) => parseInt(r.netsuite_id)));
  const notFoundIds = ids.filter((id) => !foundIds.has(id));

  if (notFoundIds.length > 0) {
    throw {
      message: `Data invoice sales order tidak ditemukan untuk netsuite_id: ${notFoundIds.join(', ')}`,
      statusCode: 404
    };
  }

  const records = rows.map(normalizeInvoiceSalesOrderRecord);
  await syncToFakturs(records);

  return { items: records };
};

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
  const { details, users_id, is_admin, roles, ...data } = payload;
  
  // Clean up potential invalid UUIDs from decodeToken defaults
  if (data.created_by === 0 || data.created_by === '0') delete data.created_by;
  if (data.updated_by === 0 || data.updated_by === '0') delete data.updated_by;

  return await repository.create(data, details);
};

const update = async (id, payload) => {
  const { details, users_id, is_admin, roles, ...data } = payload;

  // Clean up potential invalid UUIDs from decodeToken defaults
  if (data.created_by === 0 || data.created_by === '0') delete data.created_by;
  if (data.updated_by === 0 || data.updated_by === '0') delete data.updated_by;

  const result = await repository.update(id, data, details);
  if (!result) {
    throw { message: 'Data faktur tidak ditemukan', statusCode: 404 };
  }
  return result;
};

const remove = async (id, userId) => {
  // Clean up potential invalid UUIDs from decodeToken defaults
  const cleanedUserId = (userId === 0 || userId === '0') ? null : userId;
  const result = await repository.remove(id, cleanedUserId);
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
  updateStatusBulk,
  syncFromInvoiceSalesOrders
};
