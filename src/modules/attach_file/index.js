const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyToken } = require('../../middlewares');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '52428800') }
});

router.post(
  '/get',
  verifyToken,
  controller.getList
);

router.post(
  '/',
  verifyToken,
  upload.single('file'),
  controller.create
);

router.put(
  '/:id',
  verifyToken,
  upload.single('file'),
  controller.update
);

router.delete(
  '/:id/:netsuite_id',
  verifyToken,
  controller.destroy
);

module.exports = router;
