const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   GET /api/componen/get-list
 * @desc    Get componen from bridge API
 * @access  Private
 */
router.get(
  '/get-list',
  verifyToken,
  controller.getList
);

module.exports = router;
