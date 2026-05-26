const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/bill-payment/get
 * @desc    Get bill payments list dari database lokal (bridge_sanbox)
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  controller.getList
);

/**
 * @route   GET /api/netsuite/bill-payment/:id
 * @desc    Get bill payment detail by ID (UUID)
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  controller.getById
);

/**
 * @route   POST /api/netsuite/bill-payment/sync
 * @desc    Sync bill payments dari bridge API
 * @access  Private
 */
router.post(
  '/sync',
  verifyToken,
  controller.sync
);

module.exports = router;
