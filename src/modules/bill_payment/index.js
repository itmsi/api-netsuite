const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/bill-payment/get
 * @desc    Get bill payments list dari database lokal (bridge_sanbox)
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  controller.getList
);

/**
 * @route   GET /api/netsuite/bill-payment/:id
 * @desc    Get bill payment detail by ID (UUID)
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  controller.getById
);

/**
 * @route   GET /api/netsuite/bill-payment/sync/:netsuite_id
 * @desc    Force sync satu bill payment by netsuite_id dari bridge API
 * @access  Private
 */
router.get(
  '/sync/:netsuite_id',
  verifyToken,
  controller.syncById
);

/**
 * @route   POST /api/netsuite/bill-payment/attachments-files/get
 * @desc    Get bill payment attachments dari database lokal (bridge_sanbox.bills_payment_attachments)
 * @access  Private
 */
router.post(
  '/attachments-files/get',
  verifyToken,
  controller.getAttachmentFiles
);

/**
 * @route   POST /api/netsuite/bill-payment/attachments-files/sync
 * @desc    Sync daftar attachment satu bill payment dari bridge API
 * @access  Private
 */
router.post(
  '/attachments-files/sync',
  verifyToken,
  controller.syncAttachmentFiles
);

/**
 * @route   POST /api/netsuite/bill-payment/attachments-files/sync/:id
 * @desc    Convert satu file attachment (by bill payment netsuite_id) via bridge API
 * @access  Private
 */
router.post(
  '/attachments-files/sync/:id',
  verifyToken,
  controller.syncAttachmentFileById
);

/**
 * @route   GET /api/netsuite/bill-payment/attachments-files/download/:file_netsuite_id
 * @desc    Get link download file attachment by file_netsuite_id dari bridge API
 * @access  Private
 */
router.get(
  '/attachments-files/download/:file_netsuite_id',
  verifyToken,
  controller.downloadAttachmentFile
);

module.exports = router;
