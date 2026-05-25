/**
 * Swagger Schema Definitions for Faktur Module
 */

const fakturSchemas = {
  FakturDetail: {
    type: 'object',
    properties: {
      faktur_detail_id: { type: 'string', format: 'uuid' },
      faktur_id: { type: 'string', format: 'uuid' },
      baris: { type: 'string' },
      barang_or_jasa: { type: 'string' },
      kode_barang_jasa: { type: 'string' },
      nama_barang_or_jasa: { type: 'string' },
      item_displayname: { type: 'string', nullable: true, description: 'Display name item dari invoice_sales_orders.lines' },
      nama_satuan_ukur: { type: 'string' },
      harga_satuan: { type: 'number' },
      jumlah_barang_jasa: { type: 'number' },
      total_diskon: { type: 'number' },
      dpp: { type: 'number' },
      dpp_nilai_lain: { type: 'number' },
      tarif_ppn: { type: 'number' },
      ppn: { type: 'number' },
      tarif_ppnnbm: { type: 'number' },
      ppnbm: { type: 'number' }
    }
  },
  Faktur: {
    type: 'object',
    properties: {
      faktur_id: { type: 'string', format: 'uuid' },
      baris: { type: 'string' },
      tanggal_faktur: { type: 'string', format: 'date' },
      jenis_faktur: { type: 'string' },
      kode_transaksi: { type: 'string' },
      keterangan_tambahan: { type: 'string' },
      dokumen_pendukung: { type: 'string' },
      referensi: { type: 'string' },
      cap_fasilitas: { type: 'string' },
      id_tku_Penjual: { type: 'string' },
      npwp_or_nik_pembeli: { type: 'string' },
      jenis_id_pembeli: { type: 'string' },
      negara_pembeli: { type: 'string' },
      nomor_dokumen_pembeli: { type: 'string' },
      nama_pembeli: { type: 'string' },
      alamat_pembeli: { type: 'string' },
      email_pembeli: { type: 'string' },
      id_tku_pembeli: { type: 'string' },
      subsidiary: { type: 'string' },
      subsidiary_display: { type: 'string' },
      created_at: { type: 'string', format: 'date-time' },
      created_by: { type: 'string', format: 'uuid' },
      updated_at: { type: 'string', format: 'date-time' },
      updated_by: { type: 'string', format: 'uuid' },
      details: {
        type: 'array',
        items: { $ref: '#/components/schemas/FakturDetail' }
      }
    }
  },
  FakturRequest: {
    type: 'object',
    properties: {
      baris: { type: 'string' },
      tanggal_faktur: { type: 'string', format: 'date' },
      jenis_faktur: { type: 'string' },
      kode_transaksi: { type: 'string' },
      keterangan_tambahan: { type: 'string' },
      dokumen_pendukung: { type: 'string' },
      referensi: { type: 'string' },
      cap_fasilitas: { type: 'string' },
      id_tku_Penjual: { type: 'string' },
      npwp_or_nik_pembeli: { type: 'string' },
      jenis_id_pembeli: { type: 'string' },
      negara_pembeli: { type: 'string' },
      nomor_dokumen_pembeli: { type: 'string' },
      nama_pembeli: { type: 'string' },
      alamat_pembeli: { type: 'string' },
      email_pembeli: { type: 'string' },
      id_tku_pembeli: { type: 'string' },
      subsidiary: { type: 'string' },
      subsidiary_display: { type: 'string' },
      status: { type: 'boolean' },
      details: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            baris: { type: 'string' },
            barang_or_jasa: { type: 'string' },
            kode_barang_jasa: { type: 'string' },
            nama_barang_or_jasa: { type: 'string' },
            nama_satuan_ukur: { type: 'string' },
            harga_satuan: { type: 'number' },
            jumlah_barang_jasa: { type: 'number' },
            total_diskon: { type: 'number' },
            dpp: { type: 'number' },
            dpp_nilai_lain: { type: 'number' },
            tarif_ppn: { type: 'number' },
            ppn: { type: 'number' },
            tarif_ppnnbm: { type: 'number' },
            ppnbm: { type: 'number' }
          }
        }
      }
    }
  },
  FakturListRequest: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1 },
      limit: { type: 'integer', default: 10 },
      search: { type: 'string' },
      sort_by: { type: 'string', default: 'created_at' },
      sort_order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
    }
  },
  FakturResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      data: { $ref: '#/components/schemas/Faktur' }
    }
  },
  FakturListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/Faktur' }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      }
    }
  },
  FakturSyncFromInvoiceRequest: {
    type: 'object',
    description: 'Isi salah satu: netsuite_id (single) atau netsuite_ids (bulk)',
    properties: {
      netsuite_id: { type: 'integer', example: 2532 },
      netsuite_ids: {
        type: 'array',
        items: { type: 'integer' },
        example: [2532, 2533]
      }
    }
  },
  FakturSyncFromInvoiceItem: {
    type: 'object',
    properties: {
      netsuite_id: { type: 'integer', example: 2532 },
      tranid: { type: 'string', example: 'SI-IEC-2026-000009' },
      entity: { type: 'string', example: '205' },
      trandate: { type: 'string', format: 'date', example: '2026-03-24' },
      subsidiary: { type: 'string', example: '5' },
      memo: { type: 'string', example: 'bill untuk unit IEC-VIN-1' },
      fakture_id: { type: 'string', format: 'uuid', example: 'e3b0c442-98fc-1c14-9afb-f4c59f1910d2' },
      faktur_updated_at: { type: 'string', format: 'date-time', nullable: true },
      faktur_updated_by_name: { type: 'string', nullable: true, example: 'Ari Kurniawan' },
      lines: {
        type: 'array',
        items: { $ref: '#/components/schemas/InvoiceSalesOrderLine' }
      }
    }
  },
  FakturSyncFromInvoiceResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Data faktur berhasil di-sync dari invoice sales order' },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/FakturSyncFromInvoiceItem' }
          }
        }
      }
    }
  },
  FakturSyncFromInvoiceByIdResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Data faktur berhasil di-sync dari invoice sales order' },
      data: { $ref: '#/components/schemas/FakturSyncFromInvoiceItem' }
    }
  },
  FakturSyncItemDisplaynameResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Sync item_displayname selesai. Total diupdate: 120 baris' },
      data: {
        type: 'object',
        properties: {
          total_updated: { type: 'integer', example: 120, description: 'Jumlah baris faktur_details yang berhasil diupdate' }
        }
      }
    }
  },
  FakturSyncSubsidiaryResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Sync subsidiary selesai. Total diupdate: 45 baris' },
      data: {
        type: 'object',
        properties: {
          total_updated: { type: 'integer', example: 45, description: 'Jumlah baris fakturs yang berhasil diupdate' }
        }
      }
    }
  }
};

module.exports = fakturSchemas;

