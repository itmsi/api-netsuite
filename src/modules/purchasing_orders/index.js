const express = require('express');
const router = express.Router();
const controller = require('./controller');

/**
 * @route   POST /api/purchasing-orders/get-list
 * @desc    Get purchase orders from bridge API and format pagination
 * @access  Public
 */
router.post(
  '/get-list',
  controller.getList
);

module.exports = router;
