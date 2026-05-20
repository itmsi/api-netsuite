const express = require('express');
const router = express.Router();
const controller = require('./controller');
const {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation,
  statusBulkValidation,
  syncFromInvoiceValidation,
  syncFromInvoiceByIdValidation
} = require('./validation');
const { validateMiddleware } = require('../../middlewares/validation');
const { verifyToken } = require('../../middlewares/token');

/**
 * @route   POST /api/netsuite/faktur/get
 * @desc    Get faktur list with pagination
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  listValidation,
  validateMiddleware,
  controller.getList
);

/**
 * @route   POST /api/netsuite/faktur/sync-from-invoice
 * @desc    Sync faktur dari invoice_sales_orders lokal by netsuite_id
 * @access  Private
 */
router.post(
  '/sync-from-invoice',
  verifyToken,
  syncFromInvoiceValidation,
  validateMiddleware,
  controller.syncFromInvoice
);

/**
 * @route   POST /api/netsuite/faktur/sync-from-invoice/:netsuite_id
 * @desc    Sync faktur dari invoice_sales_orders lokal by single netsuite_id
 * @access  Private
 */
router.post(
  '/sync-from-invoice/:netsuite_id',
  verifyToken,
  syncFromInvoiceByIdValidation,
  validateMiddleware,
  controller.syncFromInvoiceById
);

/**
 * @route   GET /api/netsuite/faktur/:id
 * @desc    Get faktur detail by ID
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  getByIdValidation,
  validateMiddleware,
  controller.getById
);

/**
 * @route   POST /api/netsuite/faktur/create
 * @desc    Create new faktur
 * @access  Private
 */
router.post(
  '/create',
  verifyToken,
  createValidation,
  validateMiddleware,
  controller.create
);

/**
 * @route   PUT /api/netsuite/faktur/:id
 * @desc    Update existing faktur
 * @access  Private
 */
router.put(
  '/:id',
  verifyToken,
  updateValidation,
  validateMiddleware,
  controller.update
);

/**
 * @route   DELETE /api/netsuite/faktur/:id
 * @desc    Soft delete faktur
 * @access  Private
 */
router.delete(
  '/:id',
  verifyToken,
  getByIdValidation,
  validateMiddleware,
  controller.remove
);

/**
 * @route   POST /api/netsuite/faktur/status-bulk
 * @desc    Bulk update status faktur
 * @access  Private
 */
router.post(
  '/status-bulk',
  verifyToken,
  statusBulkValidation,
  validateMiddleware,
  controller.updateStatusBulk
);

module.exports = router;
