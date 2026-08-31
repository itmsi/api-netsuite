const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { verifyToken } = require("../../middlewares");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || "52428800") },
});

/**
 * @route   POST /api/netsuite/items/get-list
 * @desc    Get items dari database lokal (bridge_sanbox)
 * @access  Private
 */
router.post("/get-list", verifyToken, controller.getList);

/**
 * @route   POST /api/netsuite/items/sync
 * @desc    Sync items dari bridge API
 * @access  Private
 */
router.post("/sync", verifyToken, controller.sync);

/**
 * @route   POST /api/netsuite/items/get-item-location
 * @desc    Get item locations from local database
 * @access  Private
 */
router.post("/get-item-location", verifyToken, controller.getItemLocation);

/**
 * @route   POST /api/netsuite/items/get-receipts
 * @desc    Get item locations from local database
 * @access  Private
 */
router.post("/get-receipts", verifyToken, controller.getItemReceipts);

/**
 * @route   GET /api/netsuite/items/get-receipts/:id
 * @desc    Get receipt detail by id (UUID or netsuite_id) from local database
 * @access  Private
 */
router.get("/get-receipts/:id", verifyToken, controller.getItemReceiptById);

/**
 * @route   POST /api/netsuite/items/get-fulfillment
 * @desc    Get fulfillments from local database
 * @access  Private
 */
router.post("/get-fulfillment", verifyToken, controller.getItemFulfillments);

/**
 * @route   GET /api/netsuite/items/get-fulfillment/:id
 * @desc    Get fulfillment detail by id (UUID or netsuite_id) from local database
 * @access  Private
 */
router.get(
  "/get-fulfillment/:id",
  verifyToken,
  controller.getItemFulfillmentById,
);

/**
 * @route   GET /api/netsuite/items/sync/:id
 * @desc    Sync single item by ID dari bridge API
 * @access  Private
 */
router.get("/sync/:id", verifyToken, controller.syncById);

/**
 * @route   POST /api/netsuite/items/create-fulfillment-receipts
 * @desc    Create item receipt/fulfillment (multipart/form-data, dengan lampiran
 *          file opsional) via bridge API secara asynchronous (queue + listener)
 * @access  Private
 */
router.post(
  "/create-fulfillment-receipts",
  verifyToken,
  upload.single("file"),
  controller.createFulfillmentReceipts,
);

module.exports = router;
