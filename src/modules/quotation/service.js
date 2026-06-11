const axios = require('axios');
const knex = require('knex');
const authService = require('../auth/service');

// Knex instance untuk DB Netsuite
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

const getQuotationById = async (id) => {
  try {
    const selectCols = [
      'id', 'netsuite_id', 'tranid', 'tran_date', 'duedate',
      'entitystatus', 'entitystatus_name', 'probability', 'expectedclosedate',
      'custbody_me_approval_status', 'custbody_me_approval_status_name',
      'custbody_me_wf_created_by', 'custbody_me_wf_created_by_name',
      'salesrep', 'salesrep_name', 'opportunity', 'opportunity_name',
      'forecasttype', 'forecasttype_name', 'partner', 'partner_name',
      'status_code', 'status_name', 'customer_id', 'customer_name',
      'memo', 'approvalstatus', 'otherrefnum', 'department', 'department_name',
      'class_id', 'class_name', 'location', 'location_name',
      'subsidiary', 'subsidiary_name', 'currency', 'currency_name',
      'custbody_msi_bank_payment_so', 'custbody_msi_bank_payment_so_name',
      'custbody_cseg_cn_cfi', 'custbody_cseg_cn_cfi_name',
      'total_amount', 'last_modified_netsuite', 'datecreated', 'items',
      'is_deleted', 'created_at', 'updated_at', 'created_by', 'updated_by'
    ];

    const isNetsuiteId = /^\d+$/.test(String(id));
    let row;

    if (isNetsuiteId) {
      row = await dbNetsuite('quotations')
        .select(selectCols)
        .where('netsuite_id', parseInt(id))
        .where('is_deleted', false)
        .first();
    }

    // 2. Jika tidak ketemu, cek berdasarkan UUID (kolom id)
    if (!row) {
      // Regex untuk validasi format UUID (biar tidak error di Postgres jika input sembarang string)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        row = await dbNetsuite('quotations')
          .select(selectCols)
          .where('id', id)
          .where('is_deleted', false)
          .first();
      }
    }

    if (!row) {
      throw { message: 'Data quotation tidak ditemukan', statusCode: 404 };
    }

    if (row.total_amount !== null && row.total_amount !== undefined) {
      row.total_amount = parseFloat(row.total_amount);
    }

    return row;

  } catch (error) {
    if (error.statusCode) throw error;
    throw { message: error.message || 'Failed to fetch quotation from database', statusCode: 500 };
  }
};

const getQuotationList = async (body) => {
  try {
    const page = body.page !== undefined ? parseInt(body.page) : 1;
    const limit = parseInt(body.page_size) || parseInt(body.limit) || 20;
    const sortOrder = body.sort_order ? body.sort_order.toUpperCase() : 'DESC';
    const offset = (page - 1 < 0 ? 0 : page - 1) * limit;

    const validSortColumns = [
      'id', 'netsuite_id', 'tranid', 'tran_date', 'customer_name',
      'total_amount', 'status_name', 'approvalstatus', 'created_at', 'updated_at'
    ];
    const sortByRaw = body.sort_by || 'tran_date';
    const orderCol = validSortColumns.includes(sortByRaw) ? `quotations.${sortByRaw}` : 'quotations.tran_date';

    let query = dbNetsuite('quotations');

    if (body.search) {
      query = query.where(function () {
        this.whereILike('quotations.netsuite_id', `%${body.search}%`)
          .orWhereILike('quotations.tranid', `%${body.search}%`)
          .orWhereILike('quotations.customer_name', `%${body.search}%`)
          .orWhereILike('quotations.memo', `%${body.search}%`);
      });
    }
    if (body.is_deleted !== undefined) {
      query = query.where('quotations.is_deleted', body.is_deleted);
    }
    if (body.customer_id) {
      query = query.where('quotations.customer_id', body.customer_id);
    }
    if (body.subsidiary) {
      query = query.where('quotations.subsidiary', body.subsidiary);
    }
    if (body.approvalstatus) {
      query = query.where('quotations.approvalstatus', body.approvalstatus);
    }
    if (body.tran_date_from) {
      query = query.where('quotations.tran_date', '>=', body.tran_date_from);
    }
    if (body.tran_date_to) {
      query = query.where('quotations.tran_date', '<=', body.tran_date_to);
    }

    const countResult = await query.clone().countDistinct('quotations.id as total').first();
    const total = parseInt(countResult.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const rows = await query
      .clone()
      .select([
        'quotations.id', 'quotations.netsuite_id', 'quotations.tranid', 'quotations.tran_date', 'quotations.duedate',
        'quotations.entitystatus', 'quotations.entitystatus_name', 'quotations.probability', 'quotations.expectedclosedate',
        'quotations.custbody_me_approval_status', 'quotations.custbody_me_approval_status_name',
        'quotations.custbody_me_wf_created_by', 'quotations.custbody_me_wf_created_by_name',
        'quotations.salesrep', 'quotations.salesrep_name', 'quotations.opportunity', 'quotations.opportunity_name',
        'quotations.forecasttype', 'quotations.forecasttype_name', 'quotations.partner', 'quotations.partner_name',
        'quotations.status_code', 'quotations.status_name', 'quotations.customer_id', 'quotations.customer_name',
        'quotations.memo', 'quotations.approvalstatus', 'quotations.otherrefnum', 'quotations.department', 'quotations.department_name',
        'quotations.class_id', 'quotations.class_name', 'quotations.location', 'quotations.location_name',
        'quotations.subsidiary', 'quotations.subsidiary_name', 'quotations.currency', 'quotations.currency_name',
        'quotations.custbody_msi_bank_payment_so', 'quotations.custbody_msi_bank_payment_so_name',
        'quotations.custbody_cseg_cn_cfi', 'quotations.custbody_cseg_cn_cfi_name',
        'quotations.total_amount', 'quotations.last_modified_netsuite', 'quotations.datecreated',
        'quotations.is_deleted', 'quotations.created_at', 'quotations.updated_at', 'quotations.created_by', 'quotations.updated_by'
      ])
      .orderBy(orderCol, sortOrder)
      .limit(limit)
      .offset(offset);

    const items = rows.map(r => ({
      ...r,
      total_amount: r.total_amount !== null && r.total_amount !== undefined ? parseFloat(r.total_amount) : null
    }));

    const resPage = page === 1 && offset === 0 && body.page === 1 ? body.page : 0;

    return {
      items,
      pagination: {
        page: resPage || page,
        limit,
        total,
        totalPages
      }
    };

  } catch (error) {
    throw { message: error.message || 'Failed to fetch quotations from database', statusCode: 500 };
  }
};

const syncQuotationById = async (netsuite_id) => {
  try {
    const tokenResponse = await authService.getToken();
    const token = tokenResponse.data.access_token;

    const baseUrl = process.env.BRIDGE_BASE_URL || 'http://localhost:9570';
    const url = `${baseUrl}/api/v1/bridge/quotations/sync/${netsuite_id}`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data?.data || response.data;

  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data?.message || `Failed to sync quotation netsuite_id ${netsuite_id} from bridge API`,
        statusCode: error.response.status,
        errors: error.response.data
      };
    }
    throw { message: error.message, statusCode: 500 };
  }
};

module.exports = {
  getQuotationById,
  getQuotationList,
  syncQuotationById
};
