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
    subsidiary_display: row.subsidiary_display,
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

const SYNC_ITEM_DISPLAY_CHUNK_SIZE = 1000;
const SYNC_ITEM_DISPLAY_UPDATE_CHUNK = 500;

/**
 * Sync item_displayname di faktur_details dari kolom lines di invoice_sales_orders.
 * Proses:
 * 1. Baca invoice_sales_orders.lines secara batch
 * 2. Dari setiap line, ambil item_display dan item_displayname
 * 3. Cari faktur_details yang nama_barang_or_jasa = item_display
 * 4. Jika item_displayname tidak null/kosong, update kolom item_displayname di faktur_details
 */
const syncItemDisplayname = async () => {
  let offset = 0;
  let totalUpdated = 0;
  let hasMore = true;

  while (hasMore) {
    // Ambil batch invoice_sales_orders yang punya kolom lines tidak null
    const invoices = await db('invoice_sales_orders')
      .select('netsuite_id', 'lines')
      .whereNotNull('lines')
      .limit(SYNC_ITEM_DISPLAY_CHUNK_SIZE)
      .offset(offset);

    if (!invoices || invoices.length === 0) {
      hasMore = false;
      break;
    }

    // Bangun mapping: item_display → item_displayname dari semua lines di batch ini
    // Hanya ambil yang item_displayname tidak null/kosong
    const displaynameMap = new Map(); // key: item_display (nama_barang_or_jasa), value: item_displayname

    for (const invoice of invoices) {
      let lines = invoice.lines;
      if (typeof lines === 'string') {
        try { lines = JSON.parse(lines); } catch { lines = []; }
      }
      if (!Array.isArray(lines)) continue;

      for (const line of lines) {
        const itemDisplay = line.item_display;
        const itemDisplayname = line.item_displayname;
        if (itemDisplay && itemDisplayname && itemDisplayname.toString().trim() !== '') {
          displaynameMap.set(itemDisplay, itemDisplayname);
        }
      }
    }

    if (displaynameMap.size > 0) {
      // Ambil faktur_details yang nama_barang_or_jasa ada di map DAN item_displayname masih null/kosong
      const namaList = [...displaynameMap.keys()];

      // Proses dalam chunk supaya tidak overload query IN
      for (let i = 0; i < namaList.length; i += SYNC_ITEM_DISPLAY_UPDATE_CHUNK) {
        const chunkNama = namaList.slice(i, i + SYNC_ITEM_DISPLAY_UPDATE_CHUNK);

        const detailRows = await db('faktur_details')
          .select('faktur_detail_id', 'nama_barang_or_jasa')
          .whereIn('nama_barang_or_jasa', chunkNama)
          .where(function () {
            this.whereNull('item_displayname').orWhere('item_displayname', '');
          });

        if (detailRows.length === 0) continue;

        // Bulk update menggunakan CASE WHEN
        const caseStatements = detailRows.map(row => {
          const val = displaynameMap.get(row.nama_barang_or_jasa);
          return { id: row.faktur_detail_id, val };
        }).filter(r => r.val);

        if (caseStatements.length === 0) continue;

        // Update satu per satu dalam batch untuk safety (bisa diganti bulk jika perlu)
        for (const { id, val } of caseStatements) {
          await db('faktur_details')
            .where('faktur_detail_id', id)
            .update({ item_displayname: val });
        }

        totalUpdated += caseStatements.length;
      }
    }

    offset += SYNC_ITEM_DISPLAY_CHUNK_SIZE;

    if (invoices.length < SYNC_ITEM_DISPLAY_CHUNK_SIZE) {
      hasMore = false;
    }
  }

  return { total_updated: totalUpdated };
};

/**
 * Sync subsidiary dan subsidiary_display di fakturs dari invoice_sales_orders.
 * Proses:
 * 1. Ambil batch fakturs yang subsidiary/subsidiary_display nya kosong dan punya sales_invoice_id
 * 2. Dari batch tersebut, cari invoice_sales_orders berdasarkan netsuite_id = sales_invoice_id
 * 3. Update kolom subsidiary dan subsidiary_display di fakturs
 */
const syncSubsidiary = async () => {
  let totalUpdated = 0;

  // Fetch all fakturs that have empty subsidiary AND subsidiary_display
  const fakturs = await db('fakturs')
    .select('faktur_id', 'sales_invoice_id')
    .where(function () {
      this.where(function () {
        this.whereNull('subsidiary').orWhere('subsidiary', '');
      }).andWhere(function () {
        this.whereNull('subsidiary_display').orWhere('subsidiary_display', '');
      });
    })
    .whereNotNull('sales_invoice_id')
    .where('is_delete', false);

  if (!fakturs || fakturs.length === 0) {
    return { total_updated: 0 };
  }

  const BATCH_SIZE = 500;
  for (let i = 0; i < fakturs.length; i += BATCH_SIZE) {
    const chunk = fakturs.slice(i, i + BATCH_SIZE);

    // Ambil unique sales_invoice_ids
    const invoiceIds = [...new Set(
      chunk
        .map((f) => parseInt(f.sales_invoice_id))
        .filter((id) => !isNaN(id))
    )];

    if (invoiceIds.length > 0) {
      const invoices = await db('invoice_sales_orders')
        .select('netsuite_id', 'subsidiary', 'subsidiary_display')
        .whereIn('netsuite_id', invoiceIds)
        .where('is_deleted', false);

      const invoiceMap = new Map();
      for (const inv of invoices) {
        invoiceMap.set(String(inv.netsuite_id), {
          subsidiary: inv.subsidiary,
          subsidiary_display: inv.subsidiary_display
        });
      }

      for (const faktur of chunk) {
        const invData = invoiceMap.get(String(faktur.sales_invoice_id));
        if (invData && (invData.subsidiary || invData.subsidiary_display)) {
          await db('fakturs')
            .where('faktur_id', faktur.faktur_id)
            .update({
              subsidiary: invData.subsidiary || null,
              subsidiary_display: invData.subsidiary_display || null
            });
          totalUpdated++;
        }
      }
    }
  }

  return { total_updated: totalUpdated };
};

module.exports = {
  getList,
  getById,
  create,
  update,
  remove,
  updateStatusBulk,
  syncFromInvoiceSalesOrders,
  syncItemDisplayname,
  syncSubsidiary
};

