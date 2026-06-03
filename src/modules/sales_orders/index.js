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
 * @route   POST /api/netsuite/sales-orders/get
 * @desc    Get sales orders dari database lokal (bridge_sanbox)
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  controller.getList
);

/**
 * @route   POST /api/netsuite/sales-orders/sync
 * @desc    Sync sales orders dari bridge API
 * @access  Private
 */
router.post(
  '/sync',
  verifyToken,
  controller.sync
);

/**
 * @route   POST /api/netsuite/sales-orders/create
 * @desc    Create a new sales order via bridge API
 * @access  Private
 */
router.post(
  '/create',
  verifyToken,
  controller.create
);

/**
 * @route   PUT /api/netsuite/sales-orders/update
 * @desc    Update an existing sales order via bridge API
 * @access  Private
 */
router.put(
  '/update',
  verifyToken,
  controller.update
);

/**
 * @route   GET /api/netsuite/sales-orders/:id
 * @desc    Get sales order by netsuite_id dari DB lokal
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  controller.getById
);

/**
 * @route   GET /api/netsuite/sales-orders/sync/:id
 * @desc    Sync single sales order by ID dari bridge API
 * @access  Private
 */
router.get(
  '/sync/:id',
  verifyToken,
  controller.syncById
);

/**
 * @route   POST /api/netsuite/sales-orders/upload
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
 * @route   POST /api/netsuite/sales-orders/upload/finalize
 * @desc    Finalize file upload by moving from temp to so folder
 * @access  Private
 */
router.post(
  '/upload/finalize',
  verifyToken,
  controller.finalizeUpload
);

/**
 * @route   POST /api/netsuite/sales-orders/upload-delete
 * @desc    Delete uploaded file by share_url from database and Nextcloud
 * @access  Private
 */
router.post(
  '/upload-delete',
  verifyToken,
  controller.deleteUpload
);

/**
 * @route   POST /api/netsuite/sales-orders/upload-update
 * @desc    Update uploaded file by share_url (either replacement file, new file_name, or both)
 * @access  Private
 */
router.post(
  '/upload-update',
  verifyToken,
  upload.single('file'),
  controller.updateUpload
);

module.exports = router;
