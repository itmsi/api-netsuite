const express = require('express');
const router = express.Router();
const controller = require('./controller');

/**
 * @route   GET /api/componen/get-list
 * @desc    Get componen from bridge API
 * @access  Public
 */
router.get(
  '/get-list',
  controller.getList
);

module.exports = router;
