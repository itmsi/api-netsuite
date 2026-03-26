const express = require('express');
const router = express.Router();
const controller = require('./controller');

/**
 * @route   GET /api/auth/token
 * @desc    Get access token from bridge API
 * @access  Public
 */
router.get(
  '/token',
  controller.getToken
);

module.exports = router;
