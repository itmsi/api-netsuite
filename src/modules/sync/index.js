const express = require('express');
const router = express.Router();
const controller = require('./controller');
const {
  getListValidation,
  createValidation,
  updateValidation,
  getByIdValidation
} = require('./validation');
const { verifyToken } = require('../../middlewares');
const { validateMiddleware } = require('../../middlewares/validation');

/**
 * @route   POST /api/netsuite/sync/get
 * @desc    Get list syncs dengan pagination, search, dan sort
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  getListValidation,
  validateMiddleware,
  controller.getList
);

/**
 * @route   POST /api/netsuite/sync/create
 * @desc    Create new sync record
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
 * @route   GET /api/netsuite/sync/all
 * @desc    Trigger sync all modules (Orchestration)
 * @access  Public
 */
router.get(
  '/all',
  controller.syncAll
);

/**
 * @route   GET /api/netsuite/sync/:id
 * @desc    Get sync by ID
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
 * @route   PUT /api/netsuite/sync/:id
 * @desc    Update sync by ID
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
 * @route   DELETE /api/netsuite/sync/:id
 * @desc    Soft delete sync by ID
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
 * @route   POST /api/netsuite/sync/modules
 * @desc    Sync specific module (trigger background process)
 * @access  Private
 */
router.post(
  '/modules',
  verifyToken,
  validateMiddleware,
  controller.syncModules
);

module.exports = router;
