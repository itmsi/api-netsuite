const { body, param } = require('express-validator');

/**
 * Validation rules untuk GET list (POST body)
 */
const getValidation = [
  body('page').optional().isInt({ min: 1 }).withMessage('Page harus berupa angka positif'),
  body('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit harus antara 1-200'),
  body('search').optional().isString(),
  body('sort_by').optional().isString(),
  body('sort_order')
    .optional()
    .isIn(['asc', 'desc', 'ASC', 'DESC'])
    .withMessage('Sort order harus asc atau desc')
];

/**
 * Validation rules untuk create item_type
 */
const createValidation = [
  body('code').notEmpty().withMessage('Code wajib diisi').isString().trim(),
  body('name').notEmpty().withMessage('Name wajib diisi').isString().trim(),
  body('netsuite_id').optional().isString().trim()
];

/**
 * Validation rules untuk update item_type
 */
const updateValidation = [
  param('id').notEmpty().withMessage('ID wajib diisi'),
  body('code').optional().isString().trim(),
  body('name').optional().isString().trim(),
  body('netsuite_id').optional().isString().trim()
];

/**
 * Validation rules untuk get by ID
 */
const getByIdValidation = [
  param('id').notEmpty().withMessage('ID wajib diisi')
];

module.exports = {
  getValidation,
  createValidation,
  updateValidation,
  getByIdValidation
};
