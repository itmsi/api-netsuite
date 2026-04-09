const express = require('express');
const router = express.Router();
const controller = require('./controller');

/**
 * @route   POST /api/netsuite/customers/get-list
 * @desc    Get customers from bridge API
 * @access  Public
 */
router.post(
  '/get-list',
  controller.getList
);

/**
 * @route   POST /api/netsuite/customers/create
 * @desc    Create customer via bridge API
 * @access  Public
 */
router.post(
  '/create',
  controller.create
);

module.exports = router;
