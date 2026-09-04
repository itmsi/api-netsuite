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
 * @route   GET /api/netsuite/items/sync-receipts/:id
 * @desc    Sync receipt by id dari bridge API, lalu ambil data terbaru dari local database
 * @access  Private
 */
router.get("/sync-receipts/:id", verifyToken, controller.syncReceiptById);

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
 * @route   GET /api/netsuite/items/sync-fulfillment/:id
 * @desc    Sync fulfillment by id dari bridge API, lalu ambil data terbaru dari local database
 * @access  Private
 */
router.get(
  "/sync-fulfillment/:id",
  verifyToken,
  controller.syncFulfillmentById,
);

/**
 * @route   GET /api/netsuite/items/sync/:id
 * @desc    Sync single item by ID dari bridge API
 * @access  Private
 */
router.get("/sync/:id", verifyToken, controller.syncById);

/**
 * @route   POST /api/netsuite/items/item_locations
 * @desc    Get item locations by netsuite_item_id from local database
 * @access  Private
 */
router.post(
  "/item_locations",
  verifyToken,
  controller.getItemLocationsList,
);

/**
 * @route   POST /api/netsuite/items/item_tier_prices
 * @desc    Get item tier prices by netsuite_item_id from local database
 * @access  Private
 */
router.post(
  "/item_tier_prices",
  verifyToken,
  controller.getItemTierPricesList,
);

/**
 * @route   POST /api/netsuite/items/item_serial_numbers
 * @desc    Get item serial numbers by netsuite_item_id from local database
 * @access  Private
 */
router.post(
  "/item_serial_numbers",
  verifyToken,
  controller.getItemSerialNumbersList,
);

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

/**
 * @route   GET /api/netsuite/items/:id
 * @desc    Get item detail by netsuite_id (semua kolom tabel items) dari local database
 * @access  Private
 */
router.get("/:id", verifyToken, controller.getItemById);

module.exports = router;
