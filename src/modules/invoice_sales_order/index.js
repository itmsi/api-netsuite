const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/invoice-sales-orders/get
 * @desc    Get invoice sales orders dari database lokal (bridge_sanbox)
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  controller.getList
);

/**
 * @route   POST /api/invoice-sales-orders/sync
 * @desc    Sync invoice sales orders dari bridge API + sync ke fakturs
 * @access  Private
 */
router.post(
  '/sync',
  verifyToken,
  controller.sync
);

router.post(
  '/sync/:netsuite_id',
  verifyToken,
  controller.syncById
);

module.exports = router;
