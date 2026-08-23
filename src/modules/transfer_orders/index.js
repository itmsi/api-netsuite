const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/transfer-orders/get-list
 * @desc    Get transfer orders from local database (bridge_sanbox.transfer_orders) with pagination
 * @access  Private
 */
router.post(
  '/get-list',
  verifyToken,
  controller.getList
);

/**
 * @route   POST /api/transfer-orders/create
 * @desc    Create a new transfer order via bridge API
 * @access  Private
 */
router.post(
  '/create',
  verifyToken,
  controller.create
);

/**
 * @route   PUT /api/transfer-orders/update
 * @desc    Update an existing transfer order via bridge API
 * @access  Private
 */
router.put(
  '/update',
  verifyToken,
  controller.update
);

/**
 * @route   POST /api/transfer-orders/sync/:id
 * @desc    Sync a single transfer order by ID (UUID lokal atau netsuite_id) dari bridge API
 * @access  Private
 */
router.post(
  '/sync/:id',
  verifyToken,
  controller.syncById
);

/**
 * @route   GET /api/transfer-orders/:id
 * @desc    Get a transfer order detail by ID (UUID lokal atau netsuite_id)
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  controller.getById
);

module.exports = router;
