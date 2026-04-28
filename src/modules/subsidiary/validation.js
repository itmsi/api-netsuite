const { body, param } = require('express-validator');

/**
 * Validation rules for Subsidiary module
 */

const createValidation = [
  body('company_name')
    .notEmpty()
    .withMessage('Company name wajib diisi')
    .trim(),
  body('nomor')
    .optional()
    .trim(),
  body('abbreviation')
    .optional()
    .trim(),
];

const updateValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID wajib diisi')
    .isInt()
    .withMessage('Format ID tidak valid (harus integer)'),
  body('company_name')
    .optional()
    .trim(),
];

const getByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID wajib diisi')
    .isInt()
    .withMessage('Format ID tidak valid (harus integer)'),
];

const listValidation = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page harus berupa angka positif'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit harus antara 1-100'),
  body('sort_by')
    .optional()
    .isString(),
  body('sort_order')
    .optional()
    .isIn(['asc', 'desc', 'ASC', 'DESC'])
    .withMessage('Sort order harus asc atau desc'),
];

module.exports = {
  createValidation,
  updateValidation,
  getByIdValidation,
  listValidation
};
