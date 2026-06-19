const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/items/get-list
 * @desc    Get items dari database lokal (bridge_sanbox)
 * @access  Private
 */
router.post(
  '/get-list',
  verifyToken,
  controller.getList
);

/**
 * @route   POST /api/netsuite/items/sync
 * @desc    Sync items dari bridge API
 * @access  Private
 */
router.post(
  '/sync',
  verifyToken,
  controller.sync
);

/**
 * @route   POST /api/netsuite/items/get-item-location
 * @desc    Get item locations from local database
 * @access  Private
 */
router.post(
  '/get-item-location',
  verifyToken,
  controller.getItemLocation
);

module.exports = router;
