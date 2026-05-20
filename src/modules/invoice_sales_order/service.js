const axios = require('axios');
const knex = require('knex');
const authService = require('../auth/service');
const { pgCore: db } = require('../../config/database');

// Knex instance untuk DB Netsuite (bridge_sanbox)
const dbNetsuite = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST_NETSUITE || 'localhost',
    port: parseInt(process.env.DB_PORT_NETSUITE) || 9541,
    user: process.env.DB_USER_NETSUITE || 'msiserver',
    password: process.env.DB_PASS_NETSUITE,
    database: process.env.DB_NAME_NETSUITE || 'bridge_sanbox'
  }
});

/**
 * Format trandate "31/3/2026" to "2026-03-31" for Postgres
 */
const formatTrandate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr !== 'string') {
    if (dateStr instanceof Date) {
      return dateStr.toISOString().split('T')[0];
    }
    return dateStr;
  }
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
};

const SYNC_FAKTUR_CHUNK_SIZE = parseInt(process.env.SYNC_FAKTUR_CHUNK_SIZE) || 250;
const SYNC_FAKTUR_DETAIL_INSERT_SIZE = parseInt(process.env.SYNC_FAKTUR_DETAIL_INSERT_SIZE) || 100;
const SYNC_FAKTUR_LOOKUP_CHUNK_SIZE = parseInt(process.env.SYNC_FAKTUR_LOOKUP_CHUNK_SIZE) || 1000;
const MAX_PG_BIND_PARAMS = 65535;

const mapSyncDbError = (error) => {
  if (error?.statusCode) return error;

  if (error?.code === '08P01') {
    return {
      message: 'Gagal menyimpan faktur ke database karena query bulk insert tidak valid. Data terlalu besar atau format tidak sesuai.',
      statusCode: 500
    };
  }

  if (error?.code === '23505') {
    return {
      message: 'Data faktur duplikat, sync dibatalkan.',
      statusCode: 409
    };
  }

  return {
    message: error?.message || 'Gagal sync faktur ke database',
    statusCode: 500
  };
};

const resolveCustomerFields = (record, customer) => {
  let npwp_or_nik_pembeli = '0000000000000000';
  let jenis_id_pembeli = 'TIN';
  let nama_pembeli = record.entity;
  let alamat_pembeli = '-';
  let id_tku_pembeli = '000000';
  let nomor_dokumen_pembeli = '-';

  if (customer) {
    jenis_id_pembeli = customer.type_tax_buyer || 'TIN';

    if (jenis_id_pembeli === 'TIN') {
      npwp_or_nik_pembeli = customer.no_tax_buyer || '0000000000000000';
    } else {
      npwp_or_nik_pembeli = '0000000000000000';
    }

    nama_pembeli = customer.name_tax_buyer || customer.customer_name || '-';
    alamat_pembeli = customer.customer_address || '-';

    if (jenis_id_pembeli === 'TIN') {
      id_tku_pembeli = (customer.no_tax_buyer || '') + '000000';
    } else {
      id_tku_pembeli = '000000';
    }

    nomor_dokumen_pembeli = jenis_id_pembeli === 'TIN' ? '-' : npwp_or_nik_pembeli;
  }

  return {
    npwp_or_nik_pembeli,
    jenis_id_pembeli,
    nama_pembeli,
    alamat_pembeli,
    id_tku_pembeli,
    nomor_dokumen_pembeli
  };
};

const buildFakturData = (record, customerFields, id_tku_Penjual, barisFaktur, syncTimestamp) => ({
  sales_invoice_id: parseInt(record.netsuite_id),
  baris: barisFaktur,
  tanggal_faktur: formatTrandate(record.trandate),
  jenis_faktur: 'Normal',
  kode_transaksi: '04',
  referensi: ((record.tranid || '') + ' ' + (record.memo || '')).trim(),
  id_tku_Penjual,
  npwp_or_nik_pembeli: customerFields.npwp_or_nik_pembeli,
  jenis_id_pembeli: customerFields.jenis_id_pembeli,
  negara_pembeli: 'IDN',
  nomor_dokumen_pembeli: customerFields.nomor_dokumen_pembeli,
  nama_pembeli: customerFields.nama_pembeli,
  alamat_pembeli: customerFields.alamat_pembeli,
  id_tku_pembeli: customerFields.id_tku_pembeli,
  updated_at: syncTimestamp
});

const normalizeLineItems = (lines) => {
  if (!Array.isArray(lines)) return [];
  return lines.filter((line) => line && typeof line === 'object');
};

const buildFakturDetailRows = (faktur_id, lines) => {
  const normalizedLines = normalizeLineItems(lines);
  if (normalizedLines.length === 0) return [];

  return normalizedLines.map((line, index) => {
    const rate = Number(line.rate) || 0;
    const quantity = Number(line.quantity) || 0;
    const dpp = rate * quantity;
    const dpp_nilai_lain = (11 / 12) * dpp;
    const tarif_ppn = Number(line.taxrate ?? line.taxrate1 ?? 0) || 0;

    return {
      faktur_id,
      baris: (index + 1).toString(),
      barang_or_jasa: 'A',
      kode_barang_jasa: line.custitem_me_product_category_display === 'UNIT' ? '870900' : '980200',
      nama_barang_or_jasa: line.item_display || line.item_display_name || '-',
      nama_satuan_ukur: 'UM.0018',
      harga_satuan: rate,
      jumlah_barang_jasa: quantity,
      total_diskon: 0,
      dpp,
      dpp_nilai_lain,
      tarif_ppn,
      ppn: (12 / 100) * dpp_nilai_lain,
      tarif_ppnnbm: 0,
      ppnbm: 0
    };
  });
};

const getSafeInsertChunkSize = (rows, maxChunkSize) => {
  if (!rows.length) return maxChunkSize;

  const columnCount = Object.keys(rows[0]).length;
  const maxRowsByBindLimit = Math.floor(MAX_PG_BIND_PARAMS / columnCount);
  return Math.max(1, Math.min(maxChunkSize, maxRowsByBindLimit));
};

const bulkInsertInChunks = async (trx, table, rows, chunkSize) => {
  const safeChunkSize = getSafeInsertChunkSize(rows, chunkSize);

  for (let i = 0; i < rows.length; i += safeChunkSize) {
    const chunk = rows.slice(i, i + safeChunkSize);
    await trx(table).insert(chunk);
  }
};

const prefetchSyncLookups = async (records) => {
  const salesInvoiceIds = [...new Set(records.map((r) => parseInt(r.netsuite_id)).filter((id) => !isNaN(id)))];
  const entityIds = [...new Set(records.map((r) => r.entity).filter(Boolean))];
  const subsidiaryIds = [...new Set(records.map((r) => r.subsidiary).filter((v) => v !== null && v !== undefined && v !== ''))];

  const existingMap = new Map();
  const customerMap = new Map();
  const npwpMap = new Map();

  for (let i = 0; i < salesInvoiceIds.length; i += SYNC_FAKTUR_LOOKUP_CHUNK_SIZE) {
    const chunkIds = salesInvoiceIds.slice(i, i + SYNC_FAKTUR_LOOKUP_CHUNK_SIZE);
    const rows = await db('fakturs')
      .whereIn('sales_invoice_id', chunkIds)
      .select('faktur_id', 'sales_invoice_id');
    rows.forEach((row) => existingMap.set(parseInt(row.sales_invoice_id), row));
  }

  if (entityIds.length > 0) {
    for (let i = 0; i < entityIds.length; i += SYNC_FAKTUR_LOOKUP_CHUNK_SIZE) {
      const chunkIds = entityIds.slice(i, i + SYNC_FAKTUR_LOOKUP_CHUNK_SIZE);
      const rows = await db('customers').whereIn('customer_id_netsuite', chunkIds);
      rows.forEach((row) => customerMap.set(row.customer_id_netsuite, row));
    }
  }

  if (subsidiaryIds.length > 0) {
    const numericSubsidiaryIds = subsidiaryIds.map((id) => parseInt(id)).filter((id) => !isNaN(id));
    for (let i = 0; i < numericSubsidiaryIds.length; i += SYNC_FAKTUR_LOOKUP_CHUNK_SIZE) {
      const chunkIds = numericSubsidiaryIds.slice(i, i + SYNC_FAKTUR_LOOKUP_CHUNK_SIZE);
      const rows = await db('npwp_inlines').whereIn('id', chunkIds);
      rows.forEach((row) => npwpMap.set(row.id, row));
    }
  }

  return { existingMap, customerMap, npwpMap };
};

const attachFakturInfoToRecords = async (records) => {
  const salesInvoiceIds = [...new Set(records.map((r) => parseInt(r.netsuite_id)).filter((id) => !isNaN(id)))];
  const infoMap = new Map();

  for (let i = 0; i < salesInvoiceIds.length; i += SYNC_FAKTUR_LOOKUP_CHUNK_SIZE) {
    const chunkIds = salesInvoiceIds.slice(i, i + SYNC_FAKTUR_LOOKUP_CHUNK_SIZE);
    const rows = await db('fakturs')
      .leftJoin('employees', 'fakturs.updated_by', 'employees.employee_id')
      .whereIn('fakturs.sales_invoice_id', chunkIds)
      .select(
        'fakturs.faktur_id',
        'fakturs.sales_invoice_id',
        'fakturs.updated_at',
        'employees.employee_name'
      );

    rows.forEach((row) => infoMap.set(parseInt(row.sales_invoice_id), row));
  }

  records.forEach((record) => {
    const info = infoMap.get(parseInt(record.netsuite_id));
    if (info) {
      record.fakture_id = info.faktur_id;
      record.faktur_updated_at = info.updated_at || '';
      record.faktur_updated_by_name = info.employee_name || '';
    }
  });
};

/**
 * Sync invoice sales order to local fakturs and faktur_details tables (bulk-optimized)
 */
const syncToFakturs = async (records) => {
  if (!records || records.length === 0) return;

  try {
    const { existingMap, customerMap, npwpMap } = await prefetchSyncLookups(records);

    for (let chunkStart = 0; chunkStart < records.length; chunkStart += SYNC_FAKTUR_CHUNK_SIZE) {
      const chunk = records.slice(chunkStart, chunkStart + SYNC_FAKTUR_CHUNK_SIZE);

      await db.transaction(async (trx) => {
        const syncTimestamp = new Date();
        const fakturRowsToInsert = [];
        const fakturRowsToUpdate = [];
        const updateFakturIds = [];
        const fakturIdBySalesInvoiceId = new Map();
        const detailsToInsert = [];

        chunk.forEach((record, idx) => {
          const salesInvoiceId = parseInt(record.netsuite_id);
          const customer = customerMap.get(record.entity);
          const customerFields = resolveCustomerFields(record, customer);
          const npwpInline = npwpMap.get(parseInt(record.subsidiary));
          const id_tku_Penjual = npwpInline ? npwpInline.nitku : '0000000000000000';
          const barisFaktur = (chunkStart + idx + 1).toString();
          const fakturData = buildFakturData(record, customerFields, id_tku_Penjual, barisFaktur, syncTimestamp);

          const existing = existingMap.get(salesInvoiceId);
          if (existing) {
            fakturRowsToUpdate.push({ faktur_id: existing.faktur_id, data: fakturData });
            updateFakturIds.push(existing.faktur_id);
            fakturIdBySalesInvoiceId.set(salesInvoiceId, existing.faktur_id);
          } else {
            fakturRowsToInsert.push({
              salesInvoiceId,
              data: { ...fakturData, created_at: syncTimestamp }
            });
          }
        });

        if (fakturRowsToInsert.length > 0) {
          const insertPayload = fakturRowsToInsert.map((row) => row.data);
          const safeChunkSize = getSafeInsertChunkSize(insertPayload, 50);

          for (let i = 0; i < insertPayload.length; i += safeChunkSize) {
            const chunkPayload = insertPayload.slice(i, i + safeChunkSize);
            const inserted = await trx('fakturs')
              .insert(chunkPayload)
              .returning(['faktur_id', 'sales_invoice_id']);

            inserted.forEach((row) => {
              const salesInvoiceId = parseInt(row.sales_invoice_id);
              fakturIdBySalesInvoiceId.set(salesInvoiceId, row.faktur_id);
              existingMap.set(salesInvoiceId, { faktur_id: row.faktur_id, sales_invoice_id: row.sales_invoice_id });
            });
          }
        }

        for (const { faktur_id, data } of fakturRowsToUpdate) {
          await trx('fakturs').where('faktur_id', faktur_id).update(data);
        }

        if (updateFakturIds.length > 0) {
          await trx('faktur_details').whereIn('faktur_id', updateFakturIds).del();
        }

        chunk.forEach((record) => {
          const salesInvoiceId = parseInt(record.netsuite_id);
          const faktur_id = fakturIdBySalesInvoiceId.get(salesInvoiceId);
          if (faktur_id) {
            detailsToInsert.push(...buildFakturDetailRows(faktur_id, record.lines));
          }
        });

        if (detailsToInsert.length > 0) {
          await bulkInsertInChunks(trx, 'faktur_details', detailsToInsert, SYNC_FAKTUR_DETAIL_INSERT_SIZE);
        }
      });
    }

    await attachFakturInfoToRecords(records);
  } catch (error) {
    console.error('[syncToFakturs]', error);
    throw mapSyncDbError(error);
  }
};

/**
 * Memproses sync ke fakturs
 */
const processFakturSync = async (records, search = null) => {
  if (!records || records.length === 0) return;

  // Normalize netsuite_id
  for (const r of records) {
    // Pastikan kita memiliki netsuite_id numerik. Jika 'id' adalah UUID, abaikan untuk netsuite_id.
    if (!r.netsuite_id && r.id && !isNaN(parseInt(r.id))) {
      r.netsuite_id = r.id;
    }
    if (typeof r.lines === 'string') {
      try {
        r.lines = JSON.parse(r.lines);
      } catch (e) {
        r.lines = [];
      }
    }
  }

  // 1. Sync ke DB lokal gate_sso (invoice_sales_orders)
  const trx = await db.transaction();
  try {
    for (const record of records) {
      const data = {
        netsuite_id: parseInt(record.netsuite_id || record.id),
        tranid: record.tranid || null,
        entity: record.entity || null,
        entityid: record.entityid || null,
        trandate: formatTrandate(record.trandate),
        startdate: formatTrandate(record.startdate),
        enddate: formatTrandate(record.enddate),
        postingperiod: record.postingperiod || null,
        postingperiod_display: record.postingperiod_display || null,
        otherrefnum: record.otherrefnum || null,
        memo: record.memo || null,
        custbody_me_related_fulfillment: record.custbody_me_related_fulfillment || null,
        terms: record.terms || null,
        account: record.account || null,
        account_display: record.account_display || null,
        currency: record.currency || null,
        currency_display: record.currency_display || null,
        exchangerate: record.exchangerate ? parseFloat(record.exchangerate) : null,
        custbody_msi_bank_payment_so: record.custbody_msi_bank_payment_so || null,
        custbody_msi_bank_payment_so_display: record.custbody_msi_bank_payment_so_display || null,
        approvalstatus: record.approvalstatus || null,
        custbody_me_wf_created_by: record.custbody_me_wf_created_by || null,
        custbody_me_wf_created_by_display: record.custbody_me_wf_created_by_display || null,
        custbody_me_wf_next_approver_blank: record.custbody_me_wf_next_approver_blank || null,
        saleseffectivedate: formatTrandate(record.saleseffectivedate),
        createdfrom: record.createdfrom || null,
        createdfrom_display: record.createdfrom_display || null,
        subsidiary: record.subsidiary || null,
        subsidiary_display: record.subsidiary_display || null,
        department: record.department || null,
        department_display: record.department_display || null,
        class: record.class || null,
        class_display: record.class_display || null,
        location: record.location || null,
        location_display: record.location_display || null,
        custbody_cseg_cn_cfi: record.custbody_cseg_cn_cfi || null,
        custbody_cseg_cn_cfi_display: record.custbody_cseg_cn_cfi_display || null,
        custbody_me_description: record.custbody_me_description || null,
        lines: record.lines ? JSON.stringify(record.lines) : null,
        raw_data: JSON.stringify(record),
        last_modified_netsuite: record.last_modified_netsuite ? new Date(record.last_modified_netsuite) : null,
        is_deleted: record.is_deleted || false
      };

      const existing = await trx('invoice_sales_orders').where('netsuite_id', data.netsuite_id).first();
      if (existing) {
        data.updated_at = db.fn.now();
        await trx('invoice_sales_orders').where('netsuite_id', data.netsuite_id).update(data);
      } else {
        data.created_at = db.fn.now();
        data.updated_at = db.fn.now();
        await trx('invoice_sales_orders').insert(data);
      }
    }
    await trx.commit();
  } catch (error) {
    await trx.rollback();
    console.error('Error syncing invoice_sales_orders to gate_sso:', error);
  }

  // 2. Sync ke fakturs (proses lama)
  const ids = records.map(r => parseInt(r.netsuite_id || r.id));
  const existingFakturs = await db('fakturs')
    .leftJoin('employees', 'fakturs.updated_by', 'employees.employee_id')
    .whereIn('fakturs.sales_invoice_id', ids)
    .select(
      'fakturs.faktur_id',
      'fakturs.sales_invoice_id',
      'fakturs.updated_at',
      'employees.employee_name as updated_by_name'
    );

  const existingMap = new Map();
  existingFakturs.forEach(f => existingMap.set(parseInt(f.sales_invoice_id), f));

  const recordsToSync = [];
  const recordsToSkip = [];

  records.forEach(record => {
    const id = parseInt(record.netsuite_id || record.id);
    if (search) {
      recordsToSync.push(record);
    } else if (existingMap.has(id)) {
      recordsToSkip.push(record);
    } else {
      recordsToSync.push(record);
    }
  });

  if (recordsToSync.length > 0) {
    await syncToFakturs(recordsToSync);
  }

  recordsToSkip.forEach(record => {
    const id = parseInt(record.netsuite_id || record.id);
    const existing = existingMap.get(id);
    if (existing) {
      record.fakture_id = existing.faktur_id;
      record.faktur_updated_at = existing.updated_at;
      record.faktur_updated_by_name = existing.updated_by_name || '';
    }
  });
};

/**
 * Get invoice sales orders dari DB Netsuite (bridge_sanbox.invoice_sales_orders)
 * Format response identik dengan format bridge API sebelumnya.
 */
const getInvoiceSalesOrders = async (body) => {
  try {
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1) * limit;

    // Kolom yang boleh dijadikan sort_by
    const validSortColumns = [
      'netsuite_id', 'tranid', 'entity', 'entityid', 'trandate', 'startdate', 'enddate',
      'subsidiary', 'department', 'class', 'location', 'approvalstatus',
      'last_modified_netsuite', 'created_at', 'updated_at'
    ];
    const sortByRaw = body.sort_by === 'created_at' ? 'trandate' : (body.sort_by || 'last_modified_netsuite');
    const orderCol = validSortColumns.includes(sortByRaw) ? `invoice_sales_orders.${sortByRaw}` : 'invoice_sales_orders.last_modified_netsuite';

    let query = db('invoice_sales_orders')
      .leftJoin('customers', 'invoice_sales_orders.entity', 'customers.customer_id_netsuite')
      .where('invoice_sales_orders.is_deleted', false);

    // Filter opsional
    if (body.search) {
      query = query.where(function () {
        this.whereILike('invoice_sales_orders.tranid', `%${body.search}%`)
          .orWhereILike('invoice_sales_orders.entityid', `%${body.search}%`)
          .orWhereILike('invoice_sales_orders.memo', `%${body.search}%`);
      });
    }
    if (body.subsidiary) {
      query = query.where('invoice_sales_orders.subsidiary', String(body.subsidiary));
    }
    if (body.approvalstatus) {
      query = query.where('invoice_sales_orders.approvalstatus', String(body.approvalstatus));
    }
    if (body.trandate_start) {
      query = query.where('invoice_sales_orders.trandate', '>=', body.trandate_start);
    }
    if (body.trandate_end) {
      query = query.where('invoice_sales_orders.trandate', '<=', body.trandate_end);
    }

    if (body.status_faktur !== undefined && body.status_faktur !== null && body.status_faktur !== '' && body.status_faktur !== 'nan' && body.status_faktur !== 'null') {
      const statusValue = (body.status_faktur === 'true' || body.status_faktur === true);
      query = query.leftJoin('fakturs', 'invoice_sales_orders.netsuite_id', db.raw('fakturs.sales_invoice_id::text'))
        .where('fakturs.status', statusValue);
    }

    // Hitung total
    const countResult = await query.clone().count('* as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    // Select kolom eksplisit (exclude raw_data, id internal)
    const rows = await query
      .clone()
      .select([
        'invoice_sales_orders.netsuite_id as id',
        'invoice_sales_orders.tranid', 'invoice_sales_orders.entity',
        db.raw(`COALESCE(NULLIF(CONCAT_WS(' - ', NULLIF(customers.customer_code, ''), NULLIF(customers.customer_name, '')), ''), invoice_sales_orders.entityid) as entityid`),
        'invoice_sales_orders.trandate', 'invoice_sales_orders.startdate', 'invoice_sales_orders.enddate',
        'invoice_sales_orders.postingperiod', 'invoice_sales_orders.postingperiod_display', 'invoice_sales_orders.otherrefnum', 'invoice_sales_orders.memo',
        'invoice_sales_orders.custbody_me_related_fulfillment', 'invoice_sales_orders.terms', 'invoice_sales_orders.account', 'invoice_sales_orders.account_display',
        'invoice_sales_orders.currency', 'invoice_sales_orders.currency_display', 'invoice_sales_orders.exchangerate',
        'invoice_sales_orders.custbody_msi_bank_payment_so', 'invoice_sales_orders.custbody_msi_bank_payment_so_display',
        'invoice_sales_orders.approvalstatus',
        'invoice_sales_orders.custbody_me_wf_created_by', 'invoice_sales_orders.custbody_me_wf_created_by_display',
        'invoice_sales_orders.custbody_me_wf_next_approver_blank',
        'invoice_sales_orders.saleseffectivedate', 'invoice_sales_orders.createdfrom', 'invoice_sales_orders.createdfrom_display',
        'invoice_sales_orders.subsidiary', 'invoice_sales_orders.subsidiary_display',
        'invoice_sales_orders.department', 'invoice_sales_orders.department_display',
        'invoice_sales_orders.class', 'invoice_sales_orders.class_display',
        'invoice_sales_orders.location', 'invoice_sales_orders.location_display',
        'invoice_sales_orders.custbody_cseg_cn_cfi', 'invoice_sales_orders.custbody_cseg_cn_cfi_display',
        'invoice_sales_orders.custbody_me_description',
        'invoice_sales_orders.lines',
        'invoice_sales_orders.last_modified_netsuite',
        'customers.type_tax_buyer',
        db.raw("CASE WHEN customers.type_tax_buyer = 'TIN' THEN customers.no_tax_buyer ELSE '' END as no_tax_buyer"),
        // db.raw("CASE WHEN customers.type_tax_buyer = 'TIN' THEN customers.no_tax_buyer ELSE '' END as npwp_or_nik_pembeli"),
        db.raw("CASE WHEN customers.type_tax_buyer = 'TIN' AND customers.no_tax_buyer IS NOT NULL AND customers.no_tax_buyer != '' THEN CONCAT(customers.no_tax_buyer, '000000') ELSE '' END as npwp_or_nik_pembeli")
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    // Populate faktur info dari local DB
    if (rows.length > 0) {
      const ids = rows.map(r => parseInt(r.id));
      const existingFakturs = await db('fakturs')
        .leftJoin('employees', 'fakturs.updated_by', 'employees.employee_id')
        .whereIn('fakturs.sales_invoice_id', ids)
        .select(
          'fakturs.faktur_id',
          'fakturs.sales_invoice_id',
          'fakturs.updated_at',
          'fakturs.tanggal_faktur',
          'fakturs.npwp_or_nik_pembeli',
          'fakturs.id_tku_pembeli',
          'fakturs.status',
          'employees.employee_name as updated_by_name'
        );

      const existingMap = new Map();
      existingFakturs.forEach(f => existingMap.set(parseInt(f.sales_invoice_id), f));

      rows.forEach(record => {
        const existing = existingMap.get(parseInt(record.id));
        if (existing) {
          record.fakture_id = existing.faktur_id;
          record.faktur_updated_at = existing.updated_at;
          record.tanggal_faktur = existing.tanggal_faktur;
          record.id_tku_pembeli = existing.id_tku_pembeli;
          record.status_faktur = existing.status;
          record.faktur_updated_by_name = existing.updated_by_name || '';
        }
      });
    }

    return {
      items: rows,
      pagination: { page, limit, total, totalPages }
    };

  } catch (error) {
    throw { message: error.message || 'Failed to fetch invoice sales orders from database', statusCode: 500 };
  }
};

/**
 * Sync invoice sales orders — hit bridge API (proses lama) + sync ke fakturs.
 * Format response identik dengan get.
 */
const syncInvoiceSalesOrders = async (body) => {
  try {
    // 1. Get token
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch dari bridge API
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/invoice-sales-orders/get`;

    const filters = {};
    if (body.search) filters.search = body.search;
    if (body.subsidiary) filters.subsidiary = body.subsidiary;
    if (body.approvalstatus) filters.approvalstatus = body.approvalstatus;
    if (body.trandate_start) filters.trandate_start = body.trandate_start;
    if (body.trandate_end) filters.trandate_end = body.trandate_end;

    const requestData = {
      page: body.page || 1,
      page_size: body.limit || 10,
      sort_by: body.sort_by === 'created_at' ? 'trandate' : (body.sort_by || 'trandate'),
      sort_order: body.sort_order ? body.sort_order.toUpperCase() : 'DESC',
      filters
    };

    if (body.filters) {
      requestData.filters = { ...requestData.filters, ...body.filters };
    }

    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const resData = response.data;
    const records = resData.data || [];

    // Sync ke fakturs (proses lama)
    if (records.length > 0) {
      await processFakturSync(records, body.search);
    }

    return {
      items: records,
      pagination: {
        page: resData.page || resData.pageIndex || body.page || 1,
        limit: resData.page_size || resData.pageSize || body.limit || 10,
        total: resData.total_records || resData.totalRows || 0,
        totalPages: resData.total_pages || resData.totalPages || 0
      }
    };

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data.message || 'Failed to sync invoice sales orders from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

const syncInvoiceSalesOrderById = async (tranid) => {
  try {
    // 1. Get token
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    // 2. Fetch dari bridge API
    const baseUrl = process.env.BRIDGE_BASE_URL || 'https://api-bridge-sb.motorsights.com';
    const url = `${baseUrl}/api/v1/bridge/invoice-sales-orders/get`;

    const requestData = {
      page: 1,
      page_size: 10,
      filters: {
        tranid: tranid
      },
      is_sync: true
    };

    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const resData = response.data;
    const records = resData.data || [];

    // Sync ke gate_sso db (invoice_sales_orders), fakturs, faktur_details
    if (records.length > 0) {
      await processFakturSync(records);
      return records[0];
    } else {
      throw { message: 'Data tidak ditemukan di Netsuite', statusCode: 404 };
    }

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Failed to sync invoice sales order from bridge API',
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getInvoiceSalesOrders,
  syncInvoiceSalesOrders,
  syncInvoiceSalesOrderById,
  processFakturSync,
  syncToFakturs
};
