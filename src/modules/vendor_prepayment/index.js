const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/vendor-prepayment/get
 * @desc    Get vendor prepayments list dari database lokal
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  controller.getList
);

/**
 * @route   GET /api/netsuite/vendor-prepayment/sync/:netsuite_id
 * @desc    Force sync satu vendor prepayment by netsuite_id dari bridge API
 * @access  Private
 */
router.get(
  '/sync/:netsuite_id',
  verifyToken,
  controller.syncById
);

/**
 * @route   GET /api/netsuite/vendor-prepayment/:id
 * @desc    Get vendor prepayment detail by ID (UUID) atau netsuite_id
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  controller.getById
);

module.exports = router;
