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

module.exports = router;
