const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/cash-statement/get
 * @desc    Get cash statements (detail + summary) dari database lokal (bridge_sanbox)
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  controller.getList
);

/**
 * @route   POST /api/netsuite/cash-statement/summary
 * @desc    Get summary saldo per akun per saved search dari database lokal
 * @access  Private
 */
router.post(
  '/summary',
  verifyToken,
  controller.getSummary
);

/**
 * @route   POST /api/netsuite/cash-statement/sync
 * @desc    Sync cash statement dari NetSuite via bridge API. Body: { search_id?, full?, date? }
 * @access  Private
 */
router.post(
  '/sync',
  verifyToken,
  controller.sync
);

/**
 * @route   GET /api/netsuite/cash-statement/sync/:netsuite_id
 * @desc    Force sync satu transaksi by netsuite_id dari bridge API
 * @access  Private
 */
router.get(
  '/sync/:netsuite_id',
  verifyToken,
  controller.syncById
);

/**
 * @route   POST /api/netsuite/cash-statement/searches/get
 * @desc    Get daftar saved search Cash Statement dari database lokal
 * @access  Private
 */
router.post(
  '/searches/get',
  verifyToken,
  controller.getSearches
);

/**
 * @route   POST /api/netsuite/cash-statement/searches
 * @desc    Tambah saved search (satu atau banyak search_id) via bridge API
 * @access  Private
 */
router.post(
  '/searches',
  verifyToken,
  controller.createSearches
);

/**
 * @route   PUT /api/netsuite/cash-statement/searches/:id
 * @desc    Ubah saved search (name, description, is_active) via bridge API
 * @access  Private
 */
router.put(
  '/searches/:id',
  verifyToken,
  controller.updateSearch
);

/**
 * @route   DELETE /api/netsuite/cash-statement/searches/:id
 * @desc    Hapus saved search via bridge API
 * @access  Private
 */
router.delete(
  '/searches/:id',
  verifyToken,
  controller.deleteSearch
);

/**
 * @route   GET /api/netsuite/cash-statement/:id
 * @desc    Get cash statement detail by ID (UUID)
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  controller.getById
);

module.exports = router;
