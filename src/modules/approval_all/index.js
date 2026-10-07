const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { approvalValidation } = require('./validation');
const { verifyToken } = require('../../middlewares');
const { validateMiddleware } = require('../../middlewares/validation');

/**
 * @route   POST /api/netsuite/approval-all
 * @desc    Approve / reject transaksi NetSuite via bridge API (approval-all)
 * @access  Private
 */
router.post(
  '/',
  verifyToken,
  approvalValidation,
  validateMiddleware,
  controller.approve
);

module.exports = router;
