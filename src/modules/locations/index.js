const express = require('express');
const router = express.Router();
const controller = require('./controller');

/**
 * @route   POST /api/netsuite/locations/get-list
 * @desc    Get locations from bridge API
 * @access  Public
 */
router.post(
  '/get-list',
  controller.getList
);

module.exports = router;
