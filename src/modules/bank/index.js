const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/bank/get
 * @desc    Get banks list dari database lokal (bridge_sanbox)
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  controller.getList
);

/**
 * @route   POST /api/netsuite/bank/sync
 * @desc    Sync banks dari bridge API
 * @access  Private
 */
router.post(
  '/sync',
  verifyToken,
  controller.sync
);

module.exports = router;
