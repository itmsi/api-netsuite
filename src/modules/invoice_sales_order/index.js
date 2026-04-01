const express = require('express');
const router = express.Router();
const controller = require('./controller');

/**
 * @route   POST /api/invoice-sales-orders/get
 * @desc    Get invoice sales orders from bridge API
 * @access  Public
 */
router.post(
  '/get',
  controller.getList
);

module.exports = router;
