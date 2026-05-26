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
 * @route   GET /api/netsuite/bill-payment/sync/:netsuite_id
 * @desc    Force sync satu bill payment by netsuite_id dari bridge API
 * @access  Private
 */
router.get(
  '/sync/:netsuite_id',
  verifyToken,
  controller.syncById
);

module.exports = router;
