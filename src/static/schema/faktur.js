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
  }
};

module.exports = fakturSchemas;
