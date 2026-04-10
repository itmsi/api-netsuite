const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/classes/get-list
 * @desc    Get classes from bridge API
 * @access  Private
 */
router.post(
  '/get-list',
  verifyToken,
  controller.getList
);

module.exports = router;
