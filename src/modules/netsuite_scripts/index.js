const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');

/**
 * @route   POST /api/netsuite/netsuite_scripts/get
 * @desc    Get daftar netsuite_scripts (module & script_id) dari database bridge
 * @access  Private
 */
router.post(
  '/get',
  verifyToken,
  controller.getList
);

module.exports = router;
