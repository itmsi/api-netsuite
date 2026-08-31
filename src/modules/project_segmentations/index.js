const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/project-segmentations/get-list
 * @desc    Get project segmentations list dari database lokal
 * @access  Private
 */
router.post(
  '/get-list',
  verifyToken,
  controller.getList
);

/**
 * @route   POST /api/netsuite/project-segmentations/sync
 * @desc    Sync project segmentations dari bridge API
 * @access  Private
 */
router.post(
  '/sync',
  verifyToken,
  controller.sync
);

module.exports = router;
