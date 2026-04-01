const { body, param } = require('express-validator');

/**
 * Validation Layer
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
  body('sort_by')
    .optional()
    .isString()
    .withMessage('Sort by harus berupa string'),
  body('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order harus asc atau desc'),
  body('search').optional().isString(),
  body('type').optional().isString(),
  body('code').optional().isString(),
  body('description').optional().isString(),
  body('code_transaksi').optional().isString(),
];

const getByIdValidation = [
  param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID'),
];

const createValidation = [
  body('type')
    .notEmpty()
    .withMessage('Type tidak boleh kosong')
    .isString(),
  body('code')
    .notEmpty()
    .withMessage('Code tidak boleh kosong')
    .isString(),
  body('description').optional().isString(),
  body('code_transaksi').optional().isString(),
];

const updateValidation = [
  param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID'),
  body('type').optional().isString(),
  body('code').optional().isString(),
  body('description').optional().isString(),
  body('code_transaksi').optional().isString(),
];

module.exports = {
  listValidation,
  getByIdValidation,
  createValidation,
  updateValidation
};
