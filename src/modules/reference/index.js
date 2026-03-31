const express = require('express');
const router = express.Router();
const controller = require('./controller');
const {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation
} = require('./validation');
const { verifyToken } = require('../../middlewares/token');
const { validateMiddleware } = require('../../middlewares/validation');

/**
 * @route   POST /api/netsuite/reference/get
 * @desc    Get all references with pagination and filters
 * @access  Protected
 */
router.post(
  '/get',
  verifyToken,
  listValidation,
  validateMiddleware,
  controller.getList
);

/**
 * @route   GET /api/netsuite/reference/:id
 * @desc    Get reference by ID
 * @access  Protected
 */
router.get(
  '/:id',
  verifyToken,
  getByIdValidation,
  validateMiddleware,
  controller.getById
);

/**
 * @route   POST /api/netsuite/reference/create
 * @desc    Create new reference
 * @access  Protected
 */
router.post(
  '/create',
  verifyToken,
  createValidation,
  validateMiddleware,
  controller.create
);

/**
 * @route   PUT /api/netsuite/reference/:id
 * @desc    Update reference
 * @access  Protected
 */
router.put(
  '/:id',
  verifyToken,
  updateValidation,
  validateMiddleware,
  controller.update
);

/**
 * @route   DELETE /api/netsuite/reference/:id
 * @desc    Soft delete reference
 * @access  Protected
 */
router.delete(
  '/:id',
  verifyToken,
  getByIdValidation,
  validateMiddleware,
  controller.remove
);

module.exports = router;
