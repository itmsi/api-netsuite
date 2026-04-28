const { body, param } = require('express-validator');

/**
 * Validation rules for GET list (POST /get)
 */
const getListValidation = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page harus berupa angka positif'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit harus antara 1-200'),
  body('sort_order')
    .optional()
    .isIn(['asc', 'desc', 'ASC', 'DESC'])
    .withMessage('sort_order harus asc atau desc'),
];

/**
 * Validation rules for creating sync
 */
const createValidation = [
  body('sync_module')
    .optional({ nullable: true })
    .isString()
    .withMessage('sync_module harus berupa string')
    .isLength({ max: 255 })
    .withMessage('sync_module maksimal 255 karakter')
    .trim(),
  body('sync_status')
    .optional({ nullable: true })
    .isString()
    .withMessage('sync_status harus berupa string')
    .trim(),
];

/**
 * Validation rules for updating sync
 */
const updateValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID wajib diisi')
    .isUUID()
    .withMessage('Format ID tidak valid'),
  body('sync_module')
    .optional({ nullable: true })
    .isString()
    .withMessage('sync_module harus berupa string')
    .isLength({ max: 255 })
    .withMessage('sync_module maksimal 255 karakter')
    .trim(),
  body('sync_status')
    .optional({ nullable: true })
    .isString()
    .withMessage('sync_status harus berupa string')
    .trim(),
];

/**
 * Validation rules for getting or deleting by ID
 */
const getByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID wajib diisi')
    .isUUID()
    .withMessage('Format ID tidak valid'),
];

module.exports = {
  getListValidation,
  createValidation,
  updateValidation,
  getByIdValidation
};
