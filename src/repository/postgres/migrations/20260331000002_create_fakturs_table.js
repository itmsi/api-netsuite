/**
 * Migration: Create fakturs and faktur_details tables
 */

exports.up = function(knex) {
  return knex.schema
    .createTable('fakturs', (table) => {
      // Primary Key with UUID
      table.uuid('faktur_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      
      // Data fields
      table.string('baris').nullable();
      table.date('tanggal_faktur').nullable();
      table.string('jenis_faktur').nullable();
      table.string('kode_transaksi').nullable();
      table.text('keterangan_tambahan').nullable();
      table.string('dokumen_pendukung').nullable();
      table.string('referensi').nullable();
      table.string('cap_fasilitas').nullable();
      table.string('id_tku_Penjual').nullable();
      table.string('npwp_or_nik_pembeli').nullable();
      table.string('jenis_id_pembeli').nullable();
      table.string('negara_pembeli').nullable();
      table.string('nomor_dokumen_pembeli').nullable();
      table.string('nama_pembeli').nullable();
      table.text('alamat_pembeli').nullable();
      table.string('email_pembeli').nullable();
      table.string('id_tku_pembeli').nullable();
      
      // Timestamps and Tracking
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.uuid('created_by').nullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.uuid('updated_by').nullable();
      table.timestamp('deleted_at').nullable();
      table.uuid('deleted_by').nullable();
      table.boolean('is_delete').defaultTo(false);
      
      // Indexes
      table.index(['is_delete'], 'idx_fakturs_is_delete');
      table.index(['created_at'], 'idx_fakturs_created_at');
    })
    .createTable('faktur_details', (table) => {
      table.uuid('faktur_detail_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('faktur_id').references('faktur_id').inTable('fakturs').onDelete('CASCADE');
      
      table.string('baris').nullable();
      table.string('barang_or_jasa').nullable();
      table.string('kode_barang_jasa').nullable();
      table.string('nama_barang_or_jasa').nullable();
      table.string('nama_satuan_ukur').nullable();
      table.decimal('harga_satuan', 20, 2).nullable();
      table.decimal('jumlah_barang_jasa', 20, 2).nullable();
      table.decimal('total_diskon', 20, 2).nullable();
      table.decimal('dpp', 20, 2).nullable();
      table.decimal('dpp_nilai_lain', 20, 2).nullable();
      table.decimal('tarif_ppn', 10, 2).nullable();
      table.decimal('ppn', 20, 2).nullable();
      table.decimal('tarif_ppnnbm', 10, 2).nullable();
      table.decimal('ppnbm', 20, 2).nullable();
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('faktur_details')
    .dropTable('fakturs');
};
