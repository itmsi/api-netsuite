const express = require('express');
const router = express.Router();
const controller = require('./controller');
const {
  createValidation,
  updateValidation,
  getByIdValidation,
  getValidation
} = require('./validation');
const { verifyToken } = require('../../middlewares');
const { validateMiddleware } = require('../../middlewares/validation');

/**
 * @route   POST /api/netsuite/item_type/get
 * @desc    Get list item_type dengan pagination, search, dan sorting
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  getValidation,
  validateMiddleware,
  controller.getList
);

/**
 * @route   POST /api/netsuite/item_type/create
 * @desc    Buat data item_type baru
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
 * @route   PUT /api/netsuite/item_type/:id
 * @desc    Update data item_type
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
 * @route   DELETE /api/netsuite/item_type/:id
 * @desc    Soft delete item_type
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
 * @route   GET /api/netsuite/item_type/:id
 * @desc    Get item_type by ID
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  getByIdValidation,
  validateMiddleware,
  controller.getById
);

module.exports = router;
