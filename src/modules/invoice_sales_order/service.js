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
    const existingFaktur = await db('fakturs').where('sales_invoice_id', record.id).first();

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
      sales_invoice_id: parseInt(record.id),
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
 * Get invoice sales orders dari DB Netsuite (bridge_sanbox.invoice_sales_orders)
 * Format response identik dengan format bridge API sebelumnya.
 */
const getInvoiceSalesOrders = async (body) => {
  try {
    const page      = parseInt(body.page)  || 1;
    const limit     = parseInt(body.limit) || 10;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset    = (page - 1) * limit;

    // Kolom yang boleh dijadikan sort_by
    const validSortColumns = [
      'netsuite_id', 'tranid', 'entity', 'entityid', 'trandate', 'startdate', 'enddate',
      'subsidiary', 'department', 'class', 'location', 'approvalstatus',
      'last_modified_netsuite', 'created_at', 'updated_at'
    ];
    const sortByRaw = body.sort_by === 'created_at' ? 'trandate' : (body.sort_by || 'last_modified_netsuite');
    const orderCol  = validSortColumns.includes(sortByRaw) ? sortByRaw : 'last_modified_netsuite';

    let query = dbNetsuite('invoice_sales_orders').where('is_deleted', false);

    // Filter opsional
    if (body.search) {
      query = query.where(function () {
        this.whereILike('tranid', `%${body.search}%`)
            .orWhereILike('entityid', `%${body.search}%`)
            .orWhereILike('memo', `%${body.search}%`);
      });
    }
    if (body.subsidiary) {
      query = query.where('subsidiary', String(body.subsidiary));
    }
    if (body.approvalstatus) {
      query = query.where('approvalstatus', String(body.approvalstatus));
    }
    if (body.trandate_start) {
      query = query.where('trandate', '>=', body.trandate_start);
    }
    if (body.trandate_end) {
      query = query.where('trandate', '<=', body.trandate_end);
    }

    // Hitung total
    const countResult = await query.clone().count('* as total').first();
    const total       = parseInt(countResult.total) || 0;
    const totalPages  = Math.ceil(total / limit);

    // Select kolom eksplisit (exclude raw_data, id internal)
    const rows = await query
      .clone()
      .select([
        'netsuite_id as id',
        'tranid', 'entity', 'entityid', 'trandate', 'startdate', 'enddate',
        'postingperiod', 'postingperiod_display', 'otherrefnum', 'memo',
        'custbody_me_related_fulfillment', 'terms', 'account', 'account_display',
        'currency', 'currency_display', 'exchangerate',
        'custbody_msi_bank_payment_so', 'custbody_msi_bank_payment_so_display',
        'approvalstatus',
        'custbody_me_wf_created_by', 'custbody_me_wf_created_by_display',
        'custbody_me_wf_next_approver_blank',
        'saleseffectivedate', 'createdfrom', 'createdfrom_display',
        'subsidiary', 'subsidiary_display',
        'department', 'department_display',
        'class', 'class_display',
        'location', 'location_display',
        'custbody_cseg_cn_cfi', 'custbody_cseg_cn_cfi_display',
        'custbody_me_description',
        'lines',
        'last_modified_netsuite'
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
    if (body.search)         filters.search         = body.search;
    if (body.subsidiary)     filters.subsidiary     = body.subsidiary;
    if (body.approvalstatus) filters.approvalstatus = body.approvalstatus;
    if (body.trandate_start) filters.trandate_start = body.trandate_start;
    if (body.trandate_end)   filters.trandate_end   = body.trandate_end;

    const requestData = {
      page:       body.page  || 1,
      page_size:  body.limit || 10,
      sort_by:    body.sort_by === 'created_at' ? 'trandate' : (body.sort_by || 'trandate'),
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
      const ids = records.map(r => parseInt(r.id));
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
        const id = parseInt(record.id);
        if (body.search) {
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
        const existing = existingMap.get(parseInt(record.id));
        if (existing) {
          record.fakture_id = existing.faktur_id;
          record.faktur_updated_at = existing.updated_at;
          record.faktur_updated_by_name = existing.updated_by_name || '';
        }
      });
    }

    return {
      items: records,
      pagination: {
        page:       resData.page       || resData.pageIndex  || body.page  || 1,
        limit:      resData.page_size  || resData.pageSize   || body.limit || 10,
        total:      resData.total_records || resData.totalRows   || 0,
        totalPages: resData.total_pages   || resData.totalPages  || 0
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
  syncInvoiceSalesOrders
};
