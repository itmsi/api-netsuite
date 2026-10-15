/**
 * Upsert batch berdasarkan satu kolom key (mis. netsuite_id), pengganti pola
 * "SELECT existing lalu UPDATE / INSERT" per record.
 *
 * Hasil akhir sama dengan pola lama:
 * - key yang sudah ada di tabel -> UPDATE (where key = ...), satu query per record
 * - key yang belum ada -> INSERT, digabung jadi bulk insert
 * - key duplikat dalam satu batch -> record pertama di-insert, record berikutnya
 *   menimpa kolomnya (sama seperti insert lalu update di pola lama)
 *
 * Tidak butuh UNIQUE constraint di kolom key.
 *
 * @param {Object} trx - knex transaction
 * @param {String} table - nama tabel
 * @param {Array<Object>} rows - data per record (sudah termasuk kolom key)
 * @param {Object} options
 * @param {String} [options.key='netsuite_id'] - kolom key
 * @param {Function} [options.normalizeKey] - normalisasi nilai key untuk where & pembanding
 *   (default value.toString(): key kosong melempar error -> transaksi rollback, sama seperti pola lama)
 * @param {Function} [options.onInsert] - (row) => row yang di-insert (mis. tambah created_at)
 * @param {Function} [options.onUpdate] - (row) => row yang di-update (mis. tambah updated_at)
 * @param {Number} [options.chunkSize=200] - ukuran chunk untuk whereIn & bulk insert
 */
const upsertByKey = async (trx, table, rows, options = {}) => {
  const {
    key = 'netsuite_id',
    normalizeKey = (value) => value.toString(),
    onInsert = (row) => row,
    onUpdate = (row) => row,
    chunkSize = 200,
  } = options;

  if (!rows || rows.length === 0) return;

  const keys = [...new Set(rows.map((row) => normalizeKey(row[key])))];
  const existingKeys = new Set();
  for (let i = 0; i < keys.length; i += chunkSize) {
    const found = await trx(table).whereIn(key, keys.slice(i, i + chunkSize)).select(key);
    found.forEach((row) => existingKeys.add(normalizeKey(row[key])));
  }

  const insertMap = new Map();
  for (const row of rows) {
    const keyValue = normalizeKey(row[key]);
    if (existingKeys.has(keyValue)) {
      await trx(table).where(key, keyValue).update(onUpdate({ ...row }));
    } else if (insertMap.has(keyValue)) {
      insertMap.set(keyValue, { ...insertMap.get(keyValue), ...onUpdate({ ...row }) });
    } else {
      insertMap.set(keyValue, onInsert({ ...row }));
    }
  }

  const inserts = [...insertMap.values()];
  for (let i = 0; i < inserts.length; i += chunkSize) {
    await trx(table).insert(inserts.slice(i, i + chunkSize));
  }
};

module.exports = {
  upsertByKey,
};
