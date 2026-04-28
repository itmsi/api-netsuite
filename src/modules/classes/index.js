const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/classes/get-list
 * @desc    Get classes list dari database lokal
 * @access  Private
 */
router.post(
  '/get-list',
  verifyToken,
  controller.getList
);

/**
 * @route   POST /api/netsuite/classes/sync
 * @desc    Sync classes dari bridge API
 * @access  Private
 */
router.post(
  '/sync',
  verifyToken,
  controller.sync
);

module.exports = router;
