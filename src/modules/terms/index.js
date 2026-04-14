const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/terms/get-list
 * @desc    Get terms from bridge API
 * @access  Private
 */
router.post(
  '/get-list',
  verifyToken,
  controller.getList
);

module.exports = router;
