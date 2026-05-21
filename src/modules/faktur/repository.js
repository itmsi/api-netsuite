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
    .leftJoin('invoice_sales_orders', db.raw('fakturs.sales_invoice_id::text'), 'invoice_sales_orders.netsuite_id')
    .leftJoin('customers', 'invoice_sales_orders.entity', 'customers.customer_id_netsuite')
    .where({ 'fakturs.faktur_id': id, 'fakturs.is_delete': false })
    .select([
      'fakturs.*',
      'customers.type_tax_buyer',
      'customers.type_tax_buyer as jenis_id_pembeli',
      'customers.name_tax_buyer',
      'customers.no_tax_buyer',
      'customers.no_tax_buyer as npwp_or_nik_pembeli',
      db.raw("CASE WHEN customers.no_tax_buyer IS NOT NULL AND customers.no_tax_buyer != '' THEN CONCAT(customers.no_tax_buyer, '000000') ELSE '' END as id_tku_pembeli")
    ])
    .first();

  if (faktur) {
    const details = await db(DETAILS_TABLE)
      .where({ faktur_id: id });
    faktur.details = details.map(d => ({ ...d, is_delete: false }));
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
        faktur_id: faktur.faktur_id,
        baris: detail.baris,
        barang_or_jasa: detail.barang_or_jasa,
        kode_barang_jasa: detail.kode_barang_jasa,
        nama_barang_or_jasa: detail.nama_barang_or_jasa,
        nama_satuan_ukur: detail.nama_satuan_ukur,
        harga_satuan: detail.harga_satuan,
        jumlah_barang_jasa: detail.jumlah_barang_jasa,
        total_diskon: detail.total_diskon,
        dpp: detail.dpp,
        dpp_nilai_lain: detail.dpp_nilai_lain,
        tarif_ppn: detail.tarif_ppn,
        ppn: detail.ppn,
        tarif_ppnnbm: detail.tarif_ppnnbm,
        ppnbm: detail.ppnbm
      }));

      const inserted = await trx(DETAILS_TABLE)
        .insert(detailsToInsert)
        .returning('*');

      faktur.details = inserted.map(d => ({ ...d, is_delete: false }));
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
        sales_invoice_id: data.sales_invoice_id,
        baris: data.baris,
        tanggal_faktur: data.tanggal_faktur,
        jenis_faktur: data.jenis_faktur,
        kode_transaksi: data.kode_transaksi,
        keterangan_tambahan: data.keterangan_tambahan,
        dokumen_pendukung: data.dokumen_pendukung,
        referensi: data.referensi,
        cap_fasilitas: data.cap_fasilitas,
        id_tku_Penjual: data.id_tku_Penjual,
        npwp_or_nik_pembeli: data.npwp_or_nik_pembeli,
        jenis_id_pembeli: data.jenis_id_pembeli,
        negara_pembeli: data.negara_pembeli,
        nomor_dokumen_pembeli: data.nomor_dokumen_pembeli,
        nama_pembeli: data.nama_pembeli,
        alamat_pembeli: data.alamat_pembeli,
        email_pembeli: data.email_pembeli,
        id_tku_pembeli: data.id_tku_pembeli,
        status: data.status,
        updated_by: data.updated_by,
        updated_at: db.fn.now()
      })
      .returning('*');

    if (faktur) {
      if (details && details.length > 0) {
        for (const detail of details) {
          const hasId = detail.faktur_detail_id !== null && 
                        detail.faktur_detail_id !== undefined && 
                        String(detail.faktur_detail_id).trim() !== '' && 
                        String(detail.faktur_detail_id).trim().toLowerCase() !== 'null' && 
                        String(detail.faktur_detail_id).trim().toLowerCase() !== 'undefined';

          if (!hasId) {
            // CREATE
            if (detail.is_delete !== true && detail.is_delete !== 'true') {
              await trx(DETAILS_TABLE).insert({
                faktur_id: id,
                baris: detail.baris,
                barang_or_jasa: detail.barang_or_jasa,
                kode_barang_jasa: detail.kode_barang_jasa,
                nama_barang_or_jasa: detail.nama_barang_or_jasa,
                nama_satuan_ukur: detail.nama_satuan_ukur,
                harga_satuan: detail.harga_satuan,
                jumlah_barang_jasa: detail.jumlah_barang_jasa,
                total_diskon: detail.total_diskon,
                dpp: detail.dpp,
                dpp_nilai_lain: detail.dpp_nilai_lain,
                tarif_ppn: detail.tarif_ppn,
                ppn: detail.ppn,
                tarif_ppnnbm: detail.tarif_ppnnbm,
                ppnbm: detail.ppnbm
              });
            }
          } else if (detail.is_delete === true || detail.is_delete === 'true') {
            // DELETE
            await trx(DETAILS_TABLE)
              .where({ faktur_detail_id: detail.faktur_detail_id, faktur_id: id })
              .del();
          } else {
            // UPDATE
            await trx(DETAILS_TABLE)
              .where({ faktur_detail_id: detail.faktur_detail_id, faktur_id: id })
              .update({
                baris: detail.baris,
                barang_or_jasa: detail.barang_or_jasa,
                kode_barang_jasa: detail.kode_barang_jasa,
                nama_barang_or_jasa: detail.nama_barang_or_jasa,
                nama_satuan_ukur: detail.nama_satuan_ukur,
                harga_satuan: detail.harga_satuan,
                jumlah_barang_jasa: detail.jumlah_barang_jasa,
                total_diskon: detail.total_diskon,
                dpp: detail.dpp,
                dpp_nilai_lain: detail.dpp_nilai_lain,
                tarif_ppn: detail.tarif_ppn,
                ppn: detail.ppn,
                tarif_ppnnbm: detail.tarif_ppnnbm,
                ppnbm: detail.ppnbm
              });
          }
        }
      }

      const finalDetails = await trx(DETAILS_TABLE)
        .where({ faktur_id: id });
      faktur.details = finalDetails.map(d => ({ ...d, is_delete: false }));
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

/**
 * Bulk update status faktur
 */
const updateStatusBulk = async (payload) => {
  return await db.transaction(async (trx) => {
    const updates = payload.map(item => {
      return trx(TABLE_NAME)
        .where({ faktur_id: item.id })
        .update({
          status: item.status,
          updated_at: db.fn.now()
        });
    });
    return await Promise.all(updates);
  });
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  updateStatusBulk
};
