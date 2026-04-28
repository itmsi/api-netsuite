const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/customers/get-list
 * @desc    Get customers from bridge API
 * @access  Private
 */
router.post(
  '/get-list',
  verifyToken,
  controller.getList
);

/**
 * @route   POST /api/netsuite/customers/create
 * @desc    Create customer via bridge API
 * @access  Private
 */
router.post(
  '/create',
  verifyToken,
  controller.create
);

module.exports = router;
