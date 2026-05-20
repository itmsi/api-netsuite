const { body, param } = require('express-validator');

/**
 * Validation rules for creating faktur
 */
const createValidation = [
  body('nama_pembeli')
    .notEmpty()
    .withMessage('Nama pembeli wajib diisi')
    .trim(),
  body('tanggal_faktur')
    .optional()
    .isISO8601()
    .withMessage('Format tanggal faktur tidak valid (YYYY-MM-DD)'),
  body('details')
    .optional()
    .isArray()
    .withMessage('Details harus berupa array'),
];

/**
 * Validation rules for updating faktur
 */
const updateValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID wajib diisi')
    .isUUID()
    .withMessage('Format ID tidak valid'),
  body('nama_pembeli')
    .optional()
    .trim(),
  body('details')
    .optional()
    .isArray()
    .withMessage('Details harus berupa array'),
];

/**
 * Validation rules for getting item by ID
 */
const getByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID wajib diisi')
    .isUUID()
    .withMessage('Format ID tidak valid'),
];

/**
 * Validation rules for list with pagination (POST /get)
 */
const listValidation = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page harus berupa angka positif'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit harus antara 1-100'),
];

/**
 * Validation rules for bulk update status
 */
const statusBulkValidation = [
  body()
    .isArray({ min: 1 })
    .withMessage('Payload harus berupa array dan tidak boleh kosong'),
  body('*.id')
    .notEmpty()
    .withMessage('id wajib diisi')
    .isUUID()
    .withMessage('Format id tidak valid (harus UUID)'),
  body('*.status')
    .exists()
    .withMessage('status wajib diisi')
    .isBoolean()
    .withMessage('status harus berupa boolean')
];

/**
 * Validation rules for sync faktur from invoice_sales_orders by netsuite_id
 */
const syncFromInvoiceValidation = [
  body('netsuite_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('netsuite_id harus berupa angka positif'),
  body('netsuite_ids')
    .optional()
    .isArray({ min: 1 })
    .withMessage('netsuite_ids harus berupa array dan tidak boleh kosong'),
  body('netsuite_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Setiap netsuite_ids harus berupa angka positif'),
  body().custom((_, { req }) => {
    const hasSingle = req.body.netsuite_id !== undefined && req.body.netsuite_id !== null && req.body.netsuite_id !== '';
    const hasArray = Array.isArray(req.body.netsuite_ids) && req.body.netsuite_ids.length > 0;
    if (!hasSingle && !hasArray) {
      throw new Error('netsuite_id atau netsuite_ids wajib diisi');
    }
    return true;
  })
];

const syncFromInvoiceByIdValidation = [
  param('netsuite_id')
    .notEmpty()
    .withMessage('netsuite_id wajib diisi')
    .isInt({ min: 1 })
    .withMessage('netsuite_id harus berupa angka positif')
];

module.exports = {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation,
  statusBulkValidation,
  syncFromInvoiceValidation,
  syncFromInvoiceByIdValidation
};
