const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/log-activities/get
 * @desc    Get log activities (apps / netsuite) dari database bridge
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  controller.getList
);

/**
 * @route   POST /api/netsuite/log-activities/module-names
 * @desc    Get daftar module_name untuk filter (sumber BRIDGE_ROUTES.md)
 * @access  Private
 */
router.post(
  '/module-names',
  verifyToken,
  controller.getModuleNames
);

/**
 * @route   GET /api/netsuite/log-activities/:id
 * @desc    Get detail log activity by id (query type_data: apps / netsuite)
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  controller.getById
);

module.exports = router;
