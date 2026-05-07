const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/sales-orders/get
 * @desc    Get sales orders dari database lokal (bridge_sanbox)
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  controller.getList
);

/**
 * @route   POST /api/netsuite/sales-orders/sync
 * @desc    Sync sales orders dari bridge API
 * @access  Private
 */
router.post(
  '/sync',
  verifyToken,
  controller.sync
);

/**
 * @route   POST /api/netsuite/sales-orders/create
 * @desc    Create a new sales order via bridge API
 * @access  Private
 */
router.post(
  '/create',
  verifyToken,
  controller.create
);

/**
 * @route   PUT /api/netsuite/sales-orders/update
 * @desc    Update an existing sales order via bridge API
 * @access  Private
 */
router.put(
  '/update',
  verifyToken,
  controller.update
);

/**
 * @route   GET /api/netsuite/sales-orders/:id
 * @desc    Get sales order by netsuite_id dari DB lokal
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  controller.getById
);

/**
 * @route   GET /api/netsuite/sales-orders/sync/:id
 * @desc    Sync single sales order by ID dari bridge API
 * @access  Private
 */
router.get(
  '/sync/:id',
  verifyToken,
  controller.syncById
);

module.exports = router;
