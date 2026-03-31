/**
 * Seeder: Initial data for references table
 */

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('references').del();

  // Inserts seed entries
  const data = [
  {
    "type": "Barang/Jasa",
    "code": "A",
    "description": "Barang",
    "code_transaksi": null
  },
  {
    "type": "Barang/Jasa",
    "code": "B",
    "description": "Jasa",
    "code_transaksi": null
  },
  {
    "type": "Kode Transaksi",
    "code": "01",
    "description": "01 - kepada selain Pemungut PPN",
    "code_transaksi": null
  },
  {
    "type": "Kode Transaksi",
    "code": "02",
    "description": "02 - kepada Pemungut PPN Instansi Pemerintah",
    "code_transaksi": null
  },
  {
    "type": "Kode Transaksi",
    "code": "03",
    "description": "03 - kepada Pemungut PPN selain Instansi Pemerintah",
    "code_transaksi": null
  },
  {
    "type": "Kode Transaksi",
    "code": "04",
    "description": "04 - DPP Nilai Lain",
    "code_transaksi": null
  },
  {
    "type": "Kode Transaksi",
    "code": "05",
    "description": "05 - Besaran tertentu",
    "code_transaksi": null
  },
  {
    "type": "Kode Transaksi",
    "code": "06",
    "description": "06 - kepada orang pribadi pemegang paspor luar negeri (16E UU PPN)",
    "code_transaksi": null
  },
  {
    "type": "Kode Transaksi",
    "code": "07",
    "description": "07 - penyerahan dengan fasilitas PPN atau PPN dan PPnBM tidak dipungut/ditanggung pemerintah",
    "code_transaksi": null
  },
  {
    "type": "Kode Transaksi",
    "code": "08",
    "description": "08 -  penyerahan dengan fasilitas dibebaskan PPN atau PPN dan PPnBM",
    "code_transaksi": null
  },
  {
    "type": "Kode Transaksi",
    "code": "09",
    "description": "09 - penyerahan aktiva yang menurut tujuan semula tidak diperjualbelikan (16D UU PPN)",
    "code_transaksi": null
  },
  {
    "type": "Kode Transaksi",
    "code": "10",
    "description": "10 - Penyerahan lainnya",
    "code_transaksi": null
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00501",
    "description": "1 - Pajak Pertambahan Nilai Tidak Dipungut berdasarkan PP Nomor 10 Tahun 2012",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00502",
    "description": "2 - Pajak Pertambahan Nilai atau Pajak Pertambahan Nilai dan Pajak Penjualan atas Barang Mewah tidak dipungut",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00503",
    "description": "3 - Pajak Pertambahan Nilai dan Pajak Penjualan atas Barang Mewah Tidak Dipungut",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00504",
    "description": "4 - Pajak Pertambahan Nilai Tidak Dipungut Sesuai PP Nomor 71 Tahun 2012",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00505",
    "description": "5 - (Tidak ada Cap)",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00506",
    "description": "6 - PPN dan/atau PPnBM tidak dipungut berdasarkan PMK No. 194/PMK.03/2012",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00507",
    "description": "7 - PPN Tidak Dipungut Berdasarkan PP Nomor 15 Tahun 2015",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00508",
    "description": "8 - PPN Tidak Dipungut Berdasarkan PP Nomor 69 Tahun 2015",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00509",
    "description": "9 - PPN Tidak Dipungut Berdasarkan PP Nomor 96 Tahun 2015",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00510",
    "description": "10 - PPN Tidak Dipungut Berdasarkan PP Nomor 106 Tahun 2015",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00511",
    "description": "11 - PPN Tidak Dipungut Sesuai PP Nomor 50 Tahun 2019",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00512",
    "description": "12 - PPN atau PPN dan PPnBM Tidak Dipungut Sesuai Dengan PP Nomor 27 Tahun 2017",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00513",
    "description": "13 - PPN ditanggung PEMERINTAH EX PMK 21/PMK.010/21",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00514",
    "description": "14 - PPN DITANGGUNG PEMERINTAH EKS PMK 102/PMK.010/2021",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00515",
    "description": "15 - PPN DITANGGUNG PEMERINTAH EKS PMK 239/PMK.03/2020",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00516",
    "description": "16 - Insentif PPN DITANGGUNG PEMERINTAH EKSEKUSI PMK NOMOR 103/PMK.010/2021",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00517",
    "description": "17 - PAJAK PERTAMBAHAN NILAI TIDAK DIPUNGUT BERDASARKAN PP NOMOR 40 TAHUN 2021",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00518",
    "description": "18 - PAJAK PERTAMBAHAN NILAI TIDAK DIPUNGUT BERDASARKAN PP NOMOR 41 TAHUN 2021",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00519",
    "description": "19 - PPN DITANGGUNG PEMERINTAH EKS PMK 6/PMK.010/2022",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00520",
    "description": "20 - PPN DITANGGUNG PEMERINTAH EKSEKUSI PMK NOMOR 226/PMK.03/2021",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00521",
    "description": "21 - PPN ATAU PPN DAN PPnBM TIDAK DIPUNGUT SESUAI DENGAN PP NOMOR 53 TAHUN 2017",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00522",
    "description": "22 - PPN tidak dipungut berdasarkan PP Nomor 70 Tahun 2021",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00523",
    "description": "23 - PPN ditanggung Pemerintah Ex PMK-125/PMK.01/2020",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00524",
    "description": "24 - (Tidak ada Cap)",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00525",
    "description": "25 - PPN tidak dipungut berdasarkan PP Nomor 49 Tahun 2022",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00526",
    "description": "26 - PPN tidak dipungut berdasarkan PP Nomor 12 Tahun 2023",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00527",
    "description": "27 - PPN ditanggung Pemerintah berdasarkan PMK Nomor 38 Tahun 2023",
    "code_transaksi": "07"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00501",
    "description": "1 - PPN Dibebaskan Sesuai PP Nomor 146 Tahun 2000 Sebagaimana Telah Diubah Dengan PP Nomor 38 Tahun 2003",
    "code_transaksi": "08"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00502",
    "description": "2 - PPN Dibebaskan Sesuai PP Nomor 12 Tahun 2001 Sebagaimana Telah Beberapa Kali Diubah Terakhir Dengan PP Nomor 31 Tahun 2007",
    "code_transaksi": "08"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00503",
    "description": "3 - PPN dibebaskan berdasarkan Peraturan Pemerintah Nomor 28 Tahun 2009",
    "code_transaksi": "08"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00504",
    "description": "4 - (Tidak ada cap)",
    "code_transaksi": "08"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00505",
    "description": "5 - PPN Dibebaskan Sesuai Dengan PP Nomor 81 Tahun 2015",
    "code_transaksi": "08"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00506",
    "description": "6 - PPN Dibebaskan Berdasarkan PP Nomor 74 Tahun 2015",
    "code_transaksi": "08"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00507",
    "description": "7 - (tanpa cap)",
    "code_transaksi": "08"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00508",
    "description": "8 - PPN DIBEBASKAN SESUAI PP NOMOR 81 TAHUN 2015 SEBAGAIMANA TELAH DIUBAH DENGAN PP 48 TAHUN 2020",
    "code_transaksi": "08"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00509",
    "description": "9 - PPN DIBEBASKAN BERDASARKAN PP NOMOR 47 TAHUN 2020",
    "code_transaksi": "08"
  },
  {
    "type": "Keterangan Tambahan",
    "code": "TD.00510",
    "description": "10  -PPN Dibebaskan berdasarkan PP Nomor 49 Tahun 2022",
    "code_transaksi": "08"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01101",
    "description": "1 - untuk Kawasan Bebas",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01102",
    "description": "2 - untuk Tempat Penimbunan Berikat",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01103",
    "description": "3 - untuk Hibah dan Bantuan Luar Negeri",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01104",
    "description": "4 - untuk Avtur",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01105",
    "description": "5 - untuk Lainnya",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01106",
    "description": "6 - untuk Kontraktor Perjanjian Karya Pengusahaan Pertambangan Batubara Generasi I",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01107",
    "description": "7 - untuk Penyerahan bahan bakar minyak untuk Kapal Angkutan Laut Luar Negeri",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01108",
    "description": "8 - untuk Penyerahan jasa kena pajak terkait alat angkutan tertentu",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01109",
    "description": "9 - untuk Penyerahan BKP Tertentu di KEK",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01110",
    "description": "10 - untuk BKP tertentu yang bersifat strategis berupa anode slime",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01111",
    "description": "11 - untuk Penyerahan alat angkutan tertentu and/atau Jasa Kena Pajak terkait alat angkutan tertentu",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01112",
    "description": "12 - untuk Penyerahan kepada Kontraktor Kerja Sama Migas yang mengikuti ketentuan Peraturan Pemerintah Nomor 27 Tahun 2017",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01113",
    "description": "13 - Penyerahan Rumah Tapak dan Satuan Rumah Susun Rumah Susun Ditanggung Pemerintah Tahun Anggaran 2021",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01114",
    "description": "14 - Penyerahan Jasa Sewa Ruangan atau Bangunan Kepada Pedagang Eceran yang Ditanggung Pemerintah Tahun Anggaran 2021",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01115",
    "description": "15 - Penyerahan Barang dan Jasa Dalam Rangka Penanganan Pandemi COVID-19 (PMK 239/PMK. 03/2020)",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01116",
    "description": "16 - Insentif PMK-103/PMK.010/2021 berupa PPN atas Penyerahan Rumah Tapak dan Unit Hunian Rumah Susun yang Ditanggung Pemerintah Tahun Anggaran 2021",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01117",
    "description": "17 - Kawasan Ekonomi Khusus PP nomor 40 Tahun 2021",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01118",
    "description": "18 - Kawasan Bebas PP nomor 41 Tahun 2021",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01119",
    "description": "19 - Penyerahan Rumah Tapak dan Unit Hunian Rumah Susun yang Ditanggung Pemerintah Tahun Anggaran 2022",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01120",
    "description": "20 - PPN Ditanggung Pemerintah dalam rangka Penanganan Pandemi Corona Virus",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01121",
    "description": "21 - Penyerahan kepada Kontraktor Kerja Sama Migas yang mengikuti ketentuan Peraturan Pemerintah Nomor 53 Tahun 2017",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01122",
    "description": "22 - BKP strategis tertentu dalam bentuk anode slime dan emas butiran",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01123",
    "description": "23 - untuk penyerahan kertas koran and/atau majalah",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01124",
    "description": "24 - PPN tidak dipungut oleh Pemerintah lainnya",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01125",
    "description": "25 - BKP dan JKP tertentu",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01126",
    "description": "26 - Penyerahan BKP dan JKP di Ibu Kota Negara baru",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01127",
    "description": "27 - Penyerahan kendaraan listrik berbasis baterai",
    "code_transaksi": "07"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01101",
    "description": "1 - untuk BKP dan JKP Tertentu",
    "code_transaksi": "08"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01102",
    "description": "2 - untuk BKP Tertentu yang Bersifat Strategis",
    "code_transaksi": "08"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01103",
    "description": "3 - untuk Jasa Kebandarudaraan",
    "code_transaksi": "08"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01104",
    "description": "4 - untuk Lainnya",
    "code_transaksi": "08"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01105",
    "description": "5 - untuk BKP Tertentu yang Bersifat Strategis sesuai PP Nomor 81 Tahun 2015",
    "code_transaksi": "08"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01106",
    "description": "6 - untuk Penyerahan Jasa Kepelabuhan Tertentu untuk kegiatan angkutan laut Luar Negeri",
    "code_transaksi": "08"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01107",
    "description": "7 - untuk Penyerahan Air Bersih",
    "code_transaksi": "08"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01108",
    "description": "8 - Penyerahan BKP tertentu yang bersifat strategis berdasarkan PP 48 Tahun 2020",
    "code_transaksi": "08"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01109",
    "description": "9 - Penyerahan kepada Perwakilan Negara Asing dan Badan Internasional serta Pejabatnya",
    "code_transaksi": "08"
  },
  {
    "type": "Cap Fasilitas",
    "code": "TD.01110",
    "description": "10 - BKP dan JKP tertentu",
    "code_transaksi": "08"
  },
  {
    "type": "Jenis ID Pembeli",
    "code": "TIN",
    "description": "NPWP",
    "code_transaksi": null
  },
  {
    "type": "Jenis ID Pembeli",
    "code": "National ID",
    "description": "NIK",
    "code_transaksi": null
  },
  {
    "type": "Jenis ID Pembeli",
    "code": "Passport",
    "description": "Paspor",
    "code_transaksi": null
  },
  {
    "type": "Jenis ID Pembeli",
    "code": "Other ID",
    "description": "Dokumen Lainnya",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0003",
    "description": "Kilogram",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0004",
    "description": "Gram",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0005",
    "description": "Karat",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0001",
    "description": "Metrik Ton",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0002",
    "description": "Wet Ton",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0006",
    "description": "Kiloliter",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0007",
    "description": "Liter",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0008",
    "description": "Barrel",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0009",
    "description": "MMBTU",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0010",
    "description": "Ampere",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0011",
    "description": "Sentimeter Kubik",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0012",
    "description": "Meter Persegi",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0013",
    "description": "Meter",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0014",
    "description": "Inches",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0015",
    "description": "Sentimeter",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0016",
    "description": "Yard",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0017",
    "description": "Lusin",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0018",
    "description": "Unit",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0019",
    "description": "Set",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0020",
    "description": "Lembar",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0021",
    "description": "Piece",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0022",
    "description": "Boks",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0023",
    "description": "Tahun",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0024",
    "description": "Bulan",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0025",
    "description": "Minggu",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0026",
    "description": "Hari",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0027",
    "description": "Jam",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0028",
    "description": "Menit",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0029",
    "description": "Persen",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0030",
    "description": "Kegiatan",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0031",
    "description": "Laporan",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0032",
    "description": "Bahan",
    "code_transaksi": null
  },
  {
    "type": "Satuan Ukur",
    "code": "UM.0033",
    "description": "Lainnya",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "AUS",
    "description": "Australia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ABW",
    "description": "Aruba",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "AFG",
    "description": "Afghanistan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "AGO",
    "description": "Angola",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "AIA",
    "description": "Anguilla",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ALA",
    "description": "Aland Islands",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ALB",
    "description": "Albania",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "AND",
    "description": "Andorra",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ARE",
    "description": "United Arab Emirates",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ARG",
    "description": "Argentina",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ARM",
    "description": "Armenia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ASM",
    "description": "American Samoa",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ATA",
    "description": "Antarctica",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ATF",
    "description": "French Southern Territories",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ATG",
    "description": "Antigua and Barbuda",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "AUT",
    "description": "Austria",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "AZE",
    "description": "Azerbaijan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BDI",
    "description": "Burundi",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BEL",
    "description": "Belgium",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BEN",
    "description": "Benin",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BES",
    "description": "Bonaire, Sint Eustatius and Saba",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BFA",
    "description": "Burkina Faso",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BGD",
    "description": "Bangladesh",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BGR",
    "description": "Bulgaria",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BHR",
    "description": "Bahrain",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BHS",
    "description": "Bahamas",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BIH",
    "description": "Bosnia and Herzegovina",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BLM",
    "description": "Saint Barthelemy",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BLR",
    "description": "Belarus",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BLZ",
    "description": "Belize",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BMU",
    "description": "Bermuda",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BOL",
    "description": "Bolivia, Plurinational State of",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BRA",
    "description": "Brazil",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BRB",
    "description": "Barbados",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BRN",
    "description": "Brunei Darussalam",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BTN",
    "description": "Burutan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BVT",
    "description": "Bouvet Island",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "BWA",
    "description": "Botswana",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CAF",
    "description": "Central African Republic",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CAN",
    "description": "Canada",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CCK",
    "description": "Cocos (Keeling) Islands",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CHE",
    "description": "Switzerland",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CHL",
    "description": "Chile",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CHN",
    "description": "China",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CIV",
    "description": "Cote dIvoire",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CMR",
    "description": "Cameroon",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "COD",
    "description": "Congo, Democratic Republic of the",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "COG",
    "description": "Congo",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "COK",
    "description": "Cook Islands",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "COL",
    "description": "Colombia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "COM",
    "description": "Comoros",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CPV",
    "description": "Cabo Verde",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CRI",
    "description": "Costa Rica",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CUB",
    "description": "Cuba",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CUW",
    "description": "Curacao",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CXR",
    "description": "Christmas Island",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CY",
    "description": "Cyprus",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CYM",
    "description": "Cayman Islands",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "CZE",
    "description": "Czech Republic",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "DEU",
    "description": "Germany",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "DJI",
    "description": "Djibouti",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "DMA",
    "description": "Dominica",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "DNK",
    "description": "Denmark",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "DOM",
    "description": "Dominican Republic",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "DZA",
    "description": "Algeria",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ECU",
    "description": "Ecuador",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "EGY",
    "description": "Egypt",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ERI",
    "description": "Eritrea",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ESH",
    "description": "Western Sahara",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ESP",
    "description": "Spain",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "EST",
    "description": "Estonia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ETH",
    "description": "Ethiopia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "FIN",
    "description": "Finland",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "FJ",
    "description": "Fiji",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "FLK",
    "description": "Falkland Islands (Malvinas)",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "FRA",
    "description": "France",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "FRO",
    "description": "Faroe Islands",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "FSM",
    "description": "Micronesia, Federated States of",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GAB",
    "description": "Gabon",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GBR",
    "description": "United Kingdom",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GEO",
    "description": "Georgia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GGY",
    "description": "Guernsey",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GHA",
    "description": "Ghana",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GIB",
    "description": "Gibraltar",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GIN",
    "description": "Guinea",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GLP",
    "description": "Guadeloupe",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GMB",
    "description": "Gambia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GNB",
    "description": "Guinea-Bissau",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GQ",
    "description": "Equatorial Guinea",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GRC",
    "description": "Greece",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GRD",
    "description": "Grenada",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GRL",
    "description": "Greenland",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GS",
    "description": "South Georgia And The South Sandwich Islands",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GTM",
    "description": "Guatemala",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GUF",
    "description": "French Guiana",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GUM",
    "description": "Guam",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "GUY",
    "description": "Guyana",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "HKG",
    "description": "Hong Kong",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "HMD",
    "description": "Heard Island and McDonald Islands",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "HND",
    "description": "Honduras",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "HRV",
    "description": "Croatia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "HTI",
    "description": "Haiti",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "HUN",
    "description": "Hungary",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "IDN",
    "description": "Indonesia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "IM",
    "description": "Isle of Man",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "IND",
    "description": "India",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "IOT",
    "description": "British Indian Ocean Territory",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "IRL",
    "description": "Ireland",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "IRN",
    "description": "Iran, Islamic Republic of",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "IRQ",
    "description": "Iraq",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ISL",
    "description": "Iceland",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ISR",
    "description": "Israel",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ITA",
    "description": "Italy",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "JAM",
    "description": "Jamaica",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "JE",
    "description": "Jersey",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "JOR",
    "description": "Jordan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "JPN",
    "description": "Japan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "KAZ",
    "description": "Kazakhstan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "KEN",
    "description": "Kenya",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "KGZ",
    "description": "Kyrgyzstan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "KHM",
    "description": "Cambodia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "KI",
    "description": "Kiribati",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "KNA",
    "description": "Saint Kitts and Nevis",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "KOR",
    "description": "Korea, the Republic of",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "KR",
    "description": "Kosovo",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "KWT",
    "description": "Kuwait",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "LAO",
    "description": "Lao Peoples Democratic Republic",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "LBN",
    "description": "Lebanon",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "LBR",
    "description": "Liberia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "LBY",
    "description": "Libya",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "LCA",
    "description": "Saint Lucia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "LIE",
    "description": "Liechtenstein",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "LK",
    "description": "Stateless",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "LKA",
    "description": "Sri Langka",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "LSO",
    "description": "Lesotho",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "LTU",
    "description": "Lithuania",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "LUX",
    "description": "Luxembourg",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "LVA",
    "description": "Latvia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MAC",
    "description": "Macao",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MAF",
    "description": "Saint Martin (French part)",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MAR",
    "description": "Morocco",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MCO",
    "description": "Monaco",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MDA",
    "description": "Moldova, the Republic of",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MDG",
    "description": "Madagascar",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MDV",
    "description": "Maldives",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MEX",
    "description": "Mexico",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MHL",
    "description": "Marshall Islands",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MK",
    "description": "Macedonia, The Former Yugoslav Republic of",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MLI",
    "description": "Mali",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MLT",
    "description": "Malta",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MM",
    "description": "Myanmar",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MNE",
    "description": "Montenegro",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MNG",
    "description": "Mongolia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MNP",
    "description": "Northern Mariana Islands",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MOZ",
    "description": "Mozambique",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MRT",
    "description": "Mauritania",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MSR",
    "description": "Montserrat",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MTQ",
    "description": "Martinique",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MUS",
    "description": "Mauritius",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MWI",
    "description": "Malawi",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "MYS",
    "description": "Malaysia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "NAM",
    "description": "Namibia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "NCL",
    "description": "New Caledonia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "NER",
    "description": "Niger",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "NFK",
    "description": "Norfolk Island",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "NGA",
    "description": "Nigeria",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "NIC",
    "description": "Nicaragua",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "NIU",
    "description": "Niue",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "NLD",
    "description": "Netherlands",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "NOR",
    "description": "Norway",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "NPL",
    "description": "Nepal",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "NRU",
    "description": "Nauru",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "NZL",
    "description": "New Zealand",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "OAT",
    "description": "Qatar",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "OMN",
    "description": "Oman",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "PAK",
    "description": "Pakistan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "PAN",
    "description": "Panama",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "PCN",
    "description": "Pitcairn",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "PER",
    "description": "Peru",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "PHL",
    "description": "Philippines",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "PLW",
    "description": "Palau",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "PNG",
    "description": "Papua New Guinea",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "POL",
    "description": "Poland",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "PRI",
    "description": "Puerto Rico",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "PRK",
    "description": "Korea, Democratic People's Republic of",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "PRT",
    "description": "Portugal",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "PRY",
    "description": "Paraguay",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "PS",
    "description": "Palestine, State of",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "PYF",
    "description": "French Polynesia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "REU",
    "description": "Reunion",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ROU",
    "description": "Romania",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "RUS",
    "description": "Russian Federation",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "RWA",
    "description": "Rwanda",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SAU",
    "description": "Saudi Arabia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SB",
    "description": "Solomon Islands",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SDN",
    "description": "Sudan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SEN",
    "description": "Senegal",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SGP",
    "description": "Singapore",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SHN",
    "description": "Saint Helena, Ascension and Tristan da Cunha",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SJM",
    "description": "Svalbard and Jan Mayen",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SLE",
    "description": "Sierra Leone",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SLV",
    "description": "El Salvador",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SMR",
    "description": "San Marino",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SOM",
    "description": "Somalia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SPM",
    "description": "Saint Pierre and Miquelon",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SRB",
    "description": "Serbia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SSD",
    "description": "South Sudan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "STP",
    "description": "Sao Tome and Principe",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SUR",
    "description": "Suriname",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SVK",
    "description": "Slovakia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SVN",
    "description": "Slovenia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SWE",
    "description": "Sweden",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SWZ",
    "description": "Swaziland",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SXM",
    "description": "Sint Maarten (Dutch part)",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SYC",
    "description": "Seychelles",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "SYR",
    "description": "Syrian Arab Republic",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TCA",
    "description": "Turks and Caicos Islands",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TCD",
    "description": "Chad",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TGO",
    "description": "Togo",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "THA",
    "description": "Thailand",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TJK",
    "description": "Tajikistan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TKL",
    "description": "Tokelau",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TKM",
    "description": "Turkmenistan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TLS",
    "description": "Timor-Leste",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TON",
    "description": "Tonga",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TTO",
    "description": "Trinidad and Tobago",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TUN",
    "description": "Tunisia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TUR",
    "description": "Turkey",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TUV",
    "description": "Tuvalu",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TWN",
    "description": "Taiwan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "TZ",
    "description": "Tanzania, United Republic of",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "UGA",
    "description": "Uganda",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "UKR",
    "description": "Ukraine",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "UMI",
    "description": "United States Minor Outlying Islands",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "URY",
    "description": "Uruguay",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "USA",
    "description": "United States of America",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "UZB",
    "description": "Uzbekistan",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "VAT",
    "description": "Holy See (Vatican City State)",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "VCT",
    "description": "Saint Vincent and the Grenadines",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "VEN",
    "description": "Venezuela, Bolivarian Republic of",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "VGB",
    "description": "Virgin Islands, British",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "VIR",
    "description": "Virgin Islands, U.S.",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "VNM",
    "description": "Viet Nam",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "VUT",
    "description": "Vanuatu",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "WLF",
    "description": "Wallis and Futuna",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "WS",
    "description": "Samoa",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "YEM",
    "description": "Yemen",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "YT",
    "description": "Mayotte",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ZAF",
    "description": "South Africa",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ZMB",
    "description": "Zambia",
    "code_transaksi": null
  },
  {
    "type": "Kode Negara",
    "code": "ZWE",
    "description": "Zimbabwe",
    "code_transaksi": null
  }
];

  // Insert in batches
  return knex.batchInsert('references', data, 100);
};
