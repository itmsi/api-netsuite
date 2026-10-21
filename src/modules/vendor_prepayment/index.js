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
 * @route   POST /api/netsuite/vendor-prepayment/attachments-files/get
 * @desc    Get vendor prepayment attachments dari database lokal (vendor_prepayment_attachments)
 * @access  Private
 */
router.post(
  '/attachments-files/get',
  verifyToken,
  controller.getAttachmentFiles
);

/**
 * @route   POST /api/netsuite/vendor-prepayment/attachments-files/sync
 * @desc    Sync daftar attachment satu vendor prepayment dari bridge API
 * @access  Private
 */
router.post(
  '/attachments-files/sync',
  verifyToken,
  controller.syncAttachmentFiles
);

/**
 * @route   POST /api/netsuite/vendor-prepayment/attachments-files/sync/:id
 * @desc    Convert satu file attachment (by vendor prepayment netsuite_id) via bridge API
 * @access  Private
 */
router.post(
  '/attachments-files/sync/:id',
  verifyToken,
  controller.syncAttachmentFileById
);

/**
 * @route   GET /api/netsuite/vendor-prepayment/attachments-files/download/:file_netsuite_id
 * @desc    Get link download file attachment by file_netsuite_id dari bridge API
 * @access  Private
 */
router.get(
  '/attachments-files/download/:file_netsuite_id',
  verifyToken,
  controller.downloadAttachmentFile
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
