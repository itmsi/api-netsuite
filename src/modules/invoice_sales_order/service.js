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

/**
 * Sync invoice sales order to local fakturs and faktur_details tables
 */
const syncToFakturs = async (records) => {
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const barisFaktur = (i + 1).toString();

    // 1. Check if sales_invoice_id already exists
    const existingFaktur = await db('fakturs').where('sales_invoice_id', parseInt(record.netsuite_id)).first();

    // 10-16. Lookup customer details
    const customer = await db('customers').where('customer_id_netsuite', record.entity).first();

    let npwp_or_nik_pembeli = '0000000000000000';
    let jenis_id_pembeli = 'TIN'; // Default if not found? User says "ambil dari proses"
    let nama_pembeli = record.entity; // Fallback
    let alamat_pembeli = '-';
    let id_tku_pembeli = '000000';
    let nomor_dokumen_pembeli = '-';

    if (customer) {
      jenis_id_pembeli = customer.type_tax_buyer || 'TIN';

      // Rule 10: NPWP/NIK logic
      if (jenis_id_pembeli === 'TIN') {
        npwp_or_nik_pembeli = customer.no_tax_buyer || '0000000000000000';
      } else {
        npwp_or_nik_pembeli = '0000000000000000';
      }

      // Rule 14: Name logic
      nama_pembeli = customer.name_tax_buyer || customer.customer_name || '-';

      // Rule 15: Address logic
      alamat_pembeli = customer.customer_address || '-';

      // Rule 16: ID TKU logic
      if (jenis_id_pembeli === 'TIN') {
        id_tku_pembeli = (customer.no_tax_buyer || '') + '000000';
      } else {
        id_tku_pembeli = '000000';
      }

      // Rule 13: Document Number logic
      if (jenis_id_pembeli === 'TIN') {
        nomor_dokumen_pembeli = '-';
      } else {
        nomor_dokumen_pembeli = npwp_or_nik_pembeli;
      }
    }

    // Lookup subsidiary/NPWP Inline for id_tku_Penjual
    const npwpInline = await db('npwp_inlines').where('id', record.subsidiary).first();
    const id_tku_Penjual = npwpInline ? npwpInline.nitku : '0000000000000000';

    // 2-9, 12, 13. Prepare fakturs data
    const fakturData = {
      sales_invoice_id: parseInt(record.netsuite_id),
      baris: barisFaktur,
      tanggal_faktur: formatTrandate(record.trandate),
      jenis_faktur: 'Normal',
      kode_transaksi: '04',
      referensi: (record.tranid || '') + ' ' + (record.memo || ''),
      id_tku_Penjual: id_tku_Penjual,
      npwp_or_nik_pembeli: npwp_or_nik_pembeli,
      jenis_id_pembeli: jenis_id_pembeli,
      negara_pembeli: 'IDN',
      nomor_dokumen_pembeli: nomor_dokumen_pembeli,
      nama_pembeli: nama_pembeli,
      alamat_pembeli: alamat_pembeli,
      id_tku_pembeli: id_tku_pembeli,
      updated_at: db.fn.now()
    };

    let faktur_id;

    await db.transaction(async (trx) => {
      if (existingFaktur) {
        // Update
        faktur_id = existingFaktur.faktur_id;
        await trx('fakturs').where('faktur_id', faktur_id).update(fakturData);
        // Clear existing details for Rule 17-31 re-insertion
        await trx('faktur_details').where('faktur_id', faktur_id).del();
      } else {
        // Create
        const [newFaktur] = await trx('fakturs').insert({
          ...fakturData,
          created_at: db.fn.now()
        }).returning('faktur_id');
        faktur_id = newFaktur.faktur_id;
      }

      // 17-31. Insert details
      if (record.lines && record.lines.length > 0) {
        const detailsToInsert = record.lines.map((line, index) => ({
          faktur_id: faktur_id,
          baris: (index + 1).toString(),
          barang_or_jasa: 'A',
          kode_barang_jasa: line.custitem_me_product_category_display === 'UNIT' ? '870900' : '980200',
          nama_barang_or_jasa: line.item_display,
          nama_satuan_ukur: 'UM.0018',
          harga_satuan: line.rate,
          jumlah_barang_jasa: line.quantity,
          total_diskon: 0,
          dpp: line.rate * line.quantity,
          dpp_nilai_lain: (11 / 12) * (line.rate * line.quantity),
          tarif_ppn: line.taxrate,
          ppn: (12 / 100) * ((11 / 12) * (line.rate * line.quantity)),
          tarif_ppnnbm: 0,
          ppnbm: 0
        }));

        await trx('faktur_details').insert(detailsToInsert);
      }
    });

    // Fetch updated_at and updated_by_name
    const fakturInfo = await db('fakturs')
      .leftJoin('employees', 'fakturs.updated_by', 'employees.employee_id')
      .where('fakturs.faktur_id', faktur_id)
      .select('fakturs.updated_at', 'employees.employee_name')
      .first();

    // Attach local ID to the record for response
    record.fakture_id = faktur_id;
    record.faktur_updated_at = fakturInfo ? fakturInfo.updated_at : '';
    record.faktur_updated_by_name = fakturInfo ? fakturInfo.employee_name : '';
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
        'invoice_sales_orders.last_modified_netsuite'
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
          'employees.employee_name as updated_by_name'
        );

      const existingMap = new Map();
      existingFakturs.forEach(f => existingMap.set(parseInt(f.sales_invoice_id), f));

      rows.forEach(record => {
        const existing = existingMap.get(parseInt(record.id));
        if (existing) {
          record.fakture_id = existing.faktur_id;
          record.faktur_updated_at = existing.updated_at;
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

module.exports = {
  getInvoiceSalesOrders,
  syncInvoiceSalesOrders,
  processFakturSync
};
