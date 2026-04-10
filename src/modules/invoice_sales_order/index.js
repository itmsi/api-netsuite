const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/invoice-sales-orders/get
 * @desc    Get invoice sales orders from bridge API
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  controller.getList
);

module.exports = router;
