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

module.exports = {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation,
  statusBulkValidation
};
