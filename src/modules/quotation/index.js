const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/quotation/get
 * @desc    Get quotations list dari database lokal (bridge_sanbox)
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  controller.getList
);

/**
 * @route   GET /api/netsuite/quotation/:id
 * @desc    Get quotation detail by ID (UUID)
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  controller.getById
);

/**
 * @route   GET /api/netsuite/quotation/sync/:netsuite_id
 * @desc    Force sync satu quotation by netsuite_id dari bridge API
 * @access  Private
 */
router.get(
  '/sync/:netsuite_id',
  verifyToken,
  controller.syncById
);

/**
 * @route   POST /api/netsuite/quotation/create
 * @desc    Create quotation (Outbox Pattern)
 * @access  Private
 */
router.post(
  '/create',
  verifyToken,
  controller.create
);

/**
 * @route   PUT /api/netsuite/quotation/update
 * @desc    Update quotation (Outbox Pattern)
 * @access  Private
 */
router.put(
  '/update',
  verifyToken,
  controller.update
);

module.exports = router;
