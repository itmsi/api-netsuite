const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { verifyToken } = require("../../middlewares");

/**
 * @route   POST /api/netsuite/inventory_adjustments/get
 * @desc    Get inventory adjustments dari local database (bridge_sanbox)
 * @access  Private
 */
router.post("/get", verifyToken, controller.getList);

/**
 * @route   GET /api/netsuite/inventory_adjustments/sync/:id
 * @desc    Sync inventory adjustment by id dari bridge API, lalu ambil data terbaru dari local database
 * @access  Private
 */
router.get("/sync/:id", verifyToken, controller.syncById);

/**
 * @route   POST /api/netsuite/inventory_adjustments/create
 * @desc    Create inventory adjustment via bridge API
 * @access  Private
 */
router.post("/create", verifyToken, controller.create);

/**
 * @route   GET /api/netsuite/inventory_adjustments/:id
 * @desc    Get inventory adjustment detail by id (UUID) atau netsuite_id (string) dari local database
 * @access  Private
 */
router.get("/:id", verifyToken, controller.getById);

module.exports = router;
