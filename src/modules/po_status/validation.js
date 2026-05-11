const { body, param } = require('express-validator');

const getValidation = [
  body('page').optional().isInt({ min: 1 }).withMessage('Page harus berupa angka positif'),
  body('limit').optional().isInt({ min: 1 }).withMessage('Limit harus berupa angka positif'),
  body('search').optional().isString(),
  body('sort_by').optional().isString(),
  body('sort_order').optional().isIn(['asc', 'desc', 'ASC', 'DESC']).withMessage('Sort order harus asc atau desc')
];

const createValidation = [
  body('code').notEmpty().withMessage('Code wajib diisi').isString().trim(),
  body('name').notEmpty().withMessage('Name wajib diisi').isString().trim()
];

const updateValidation = [
  param('id').notEmpty().withMessage('ID wajib diisi').isInt().withMessage('Format ID harus integer'),
  body('code').optional().isString().trim(),
  body('name').optional().isString().trim()
];

const getByIdValidation = [
  param('id').notEmpty().withMessage('ID wajib diisi').isInt().withMessage('Format ID harus integer')
];

module.exports = {
  getValidation,
  createValidation,
  updateValidation,
  getByIdValidation
};
