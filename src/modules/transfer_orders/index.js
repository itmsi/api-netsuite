const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '52428800') }
});

/**
 * @route   POST /api/transfer-orders/get-list
 * @desc    Get transfer orders from local database (bridge_sanbox.transfer_orders) with pagination
 * @access  Private
 */
router.post(
  '/get-list',
  verifyToken,
  controller.getList
);

/**
 * @route   POST /api/transfer-orders/create
 * @desc    Create a new transfer order via bridge API
 * @access  Private
 */
router.post(
  '/create',
  verifyToken,
  controller.create
);

/**
 * @route   PUT /api/transfer-orders/update
 * @desc    Update an existing transfer order via bridge API
 * @access  Private
 */
router.put(
  '/update',
  verifyToken,
  controller.update
);

/**
 * @route   POST /api/transfer-orders/sync/:id
 * @desc    Sync a single transfer order by ID (UUID lokal atau netsuite_id) dari bridge API
 * @access  Private
 */
router.post(
  '/sync/:id',
  verifyToken,
  controller.syncById
);

/**
 * @route   POST /api/transfer-orders/upload
 * @desc    Upload file to Nextcloud Temp Directory
 * @access  Private
 */
router.post(
  '/upload',
  verifyToken,
  upload.single('file'),
  controller.uploadTempFile
);

/**
 * @route   POST /api/transfer-orders/upload/finalize
 * @desc    Finalize file upload by moving from temp to transfer order folder
 * @access  Private
 */
router.post(
  '/upload/finalize',
  verifyToken,
  controller.finalizeUpload
);

/**
 * @route   POST /api/transfer-orders/upload-delete
 * @desc    Delete uploaded file by share_url from database and Nextcloud
 * @access  Private
 */
router.post(
  '/upload-delete',
  verifyToken,
  controller.deleteUpload
);

/**
 * @route   POST /api/transfer-orders/upload-update
 * @desc    Update uploaded file by share_url (either replacement file, new file_name, or both)
 * @access  Private
 */
router.post(
  '/upload-update',
  verifyToken,
  upload.single('file'),
  controller.updateUpload
);

/**
 * @route   GET /api/transfer-orders/:id
 * @desc    Get a transfer order detail by ID (UUID lokal atau netsuite_id)
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  controller.getById
);

module.exports = router;
