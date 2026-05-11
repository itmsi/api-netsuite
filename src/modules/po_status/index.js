const express = require('express');
const router = express.Router();
const controller = require('./controller');
const {
  createValidation,
  updateValidation,
  getByIdValidation,
  getValidation
} = require('./validation');
const { verifyToken } = require('../../middlewares');
const { validateMiddleware } = require('../../middlewares/validation');

/**
 * @route   POST /api/netsuite/po_status/get
 */
router.post(
  '/get',
  verifyToken,
  getValidation,
  validateMiddleware,
  controller.getAll
);

/**
 * @route   POST /api/netsuite/po_status/create
 */
router.post(
  '/create',
  verifyToken,
  createValidation,
  validateMiddleware,
  controller.create
);

/**
 * @route   PUT /api/netsuite/po_status/:id
 */
router.put(
  '/:id',
  verifyToken,
  updateValidation,
  validateMiddleware,
  controller.update
);

/**
 * @route   DELETE /api/netsuite/po_status/:id
 */
router.delete(
  '/:id',
  verifyToken,
  getByIdValidation,
  validateMiddleware,
  controller.remove
);

/**
 * @route   GET /api/netsuite/po_status/:id
 */
router.get(
  '/:id',
  verifyToken,
  getByIdValidation,
  validateMiddleware,
  controller.getById
);

module.exports = router;
