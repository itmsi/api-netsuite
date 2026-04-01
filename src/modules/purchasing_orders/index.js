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

/**
 * @route   POST /api/purchasing-orders/create
 * @desc    Create a new purchase order via bridge API
 * @access  Public
 */
router.post(
  '/create',
  controller.create
);

/**
 * @route   POST /api/purchasing-orders/approval
 * @desc    Approve a purchase order via bridge API
 * @access  Public
 */
router.post(
  '/approval',
  controller.approve
);

/**
 * @route   GET /api/purchasing-orders/:id
 * @desc    Get a purchase order detail by ID via NetSuite RESTlet
 * @access  Public
 */
router.get(
  '/:id',
  controller.getById
);

module.exports = router;
