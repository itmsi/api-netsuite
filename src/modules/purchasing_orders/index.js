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
 * @route   POST /api/purchasing-orders/dashboard
 * @desc    Get purchase orders dashboard from bridge API
 * @access  Private
 */
router.post(
  '/dashboard',
  verifyToken,
  controller.dashboard
);


/**
 * @route   POST /api/purchasing-orders/get-list
 * @desc    Get purchase orders from bridge API and format pagination
 * @access  Private
 */
router.post(
  '/get-list',
  verifyToken,
  controller.getList
);

/**
 * @route   POST /api/purchasing-orders/sync
 * @desc    Sync purchase orders dari bridge API (proses hit API, format sama dengan get-list)
 * @access  Private
 */
router.post(
  '/sync',
  verifyToken,
  controller.sync
);

/**
 * @route   POST /api/purchasing-orders/create
 * @desc    Create a new purchase order via bridge API
 * @access  Private
 */
router.post(
  '/create',
  verifyToken,
  controller.create
);

/**
 * @route   PUT /api/purchasing-orders/update
 * @desc    Update an existing purchase order via bridge API
 * @access  Private
 */
router.put(
  '/update',
  verifyToken,
  controller.update
);

/**
 * @route   POST /api/purchasing-orders/approval
 * @desc    Approve a purchase order via bridge API
 * @access  Private
 */
router.post(
  '/approval',
  verifyToken,
  controller.approve
);

/**
 * @route   POST /api/purchasing-orders/receive-list
 * @desc    Get receives from bridge_sanbox DB
 * @access  Private
 */
router.post(
  '/receive-list',
  verifyToken,
  controller.getReceiveList
);

/**
 * @route   GET /api/purchasing-orders/receive-list/:id
 * @desc    Get receive detail by ID from bridge_sanbox DB
 * @access  Private
 */
router.get(
  '/receive-list/:id',
  verifyToken,
  controller.getReceiveById
);

router.post(
  '/receive-list/sync',
  verifyToken,
  controller.syncReceiveList
);

/**
 * @route   POST /api/purchasing-orders/receive-list/history-logs
 * @desc    Get receive history logs (FAILED events)
 * @access  Private
 */
router.post(
  '/receive-list/history-logs',
  verifyToken,
  controller.getReceiveHistoryLogs
);

/**
 * @route   POST /api/purchasing-orders/receive-item
 * @desc    Receive item for a purchase order via bridge API
 * @access  Private
 */
router.post(
  '/receive-item',
  verifyToken,
  controller.receiveItem
);

/**
 * @route   POST /api/purchasing-orders/print
 * @desc    Print purchase order via bridge API
 * @access  Private
 */
router.post(
  '/print',
  verifyToken,
  controller.print
);

router.get(
  '/sync/:id',
  verifyToken,
  controller.syncById
);

/**
 * @route   POST /api/purchasing-orders/sync/byidall
 * @desc    Sync all purchase orders with status pendingBillPartReceived dari bridge API
 * @access  Private
 */
router.post(
  '/sync/byidall',
  verifyToken,
  controller.syncByIdAll
);

/**
 * @route   GET /api/purchasing-orders/:id
 * @desc    Get a purchase order detail by ID via NetSuite RESTlet
 * @access  Private
 */
router.get(
  '/:id',
  verifyToken,
  controller.getById
);

/**
 * @route   POST /api/purchasing-orders/retry/:id
 * @desc    Manual retry for purchase order creation
 * @access  Private
 */
router.post(
  '/retry/:id',
  verifyToken,
  controller.retry
);

/**
 * @route   POST /api/purchasing-orders/get-items
 * @desc    Get items of a purchase order from local database (JSONB lines)
 * @access  Private
 */
router.post(
  '/get-items',
  verifyToken,
  controller.getItems
);

/**
 * @route   POST /api/purchasing-orders/upload
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
 * @route   POST /api/purchasing-orders/upload/finalize
 * @desc    Finalize file upload by moving from temp to po folder
 * @access  Private
 */
router.post(
  '/upload/finalize',
  verifyToken,
  controller.finalizeUpload
);

/**
 * @route   POST /api/purchasing-orders/upload-delete
 * @desc    Delete uploaded file by share_url from database and Nextcloud
 * @access  Private
 */
router.post(
  '/upload-delete',
  verifyToken,
  controller.deleteUpload
);

/**
 * @route   POST /api/purchasing-orders/upload-update
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
