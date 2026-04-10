const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/items/get-list
 * @desc    Get items from bridge API
 * @access  Private
 */
router.post(
  '/get-list',
  verifyToken,
  controller.getList
);

module.exports = router;
