const express = require('express');
const router = express.Router();
const controller = require('./controller');
const {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation
} = require('./validation');
const { validateMiddleware } = require('../../middlewares/validation');
const { verifyToken } = require('../../middlewares/token');

/**
 * @route   POST /api/netsuite/subsidiary/get
 * @desc    Get subsidiary list with pagination
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
 * @route   GET /api/netsuite/subsidiary/:id
 * @desc    Get subsidiary detail by ID
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
 * @route   POST /api/netsuite/subsidiary/create
 * @desc    Create new subsidiary
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
 * @route   PUT /api/netsuite/subsidiary/:id
 * @desc    Update existing subsidiary
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
 * @route   DELETE /api/netsuite/subsidiary/:id
 * @desc    Soft delete subsidiary
 * @access  Private
 */
router.delete(
  '/:id',
  verifyToken,
  getByIdValidation,
  validateMiddleware,
  controller.remove
);

module.exports = router;
