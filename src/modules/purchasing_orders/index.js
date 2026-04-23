const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

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

/**
 * @route   POST /api/purchasing-orders/receive-list/sync
 * @desc    Sync receive list from bridge API
 * @access  Private
 */
router.post(
  '/receive-list/sync',
  verifyToken,
  controller.syncReceiveList
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

module.exports = router;
