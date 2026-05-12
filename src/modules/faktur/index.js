const express = require('express');
const router = express.Router();
const controller = require('./controller');
const {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation,
  statusBulkValidation
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
