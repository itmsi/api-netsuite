const express = require('express');
const router = express.Router();
const controller = require('./controller');
// If you want to use the verifyToken middleware from your existing architecture:
// const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/email/send
 * @desc    Enqueue a new email to be sent via background worker
 * @access  Private (uncomment verifyToken if needed)
 */
router.post(
  '/send',
  // verifyToken,
  controller.enqueueEmail
);

module.exports = router;
