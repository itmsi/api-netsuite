const { body } = require('express-validator');

const approvalValidation = [
  body('id').notEmpty().withMessage('ID wajib diisi').isInt().withMessage('Format ID harus integer').toInt(),
  body('recordType').notEmpty().withMessage('recordType wajib diisi').isString().trim(),
  body('actionId').notEmpty().withMessage('actionId wajib diisi').isString().trim(),
  body('note').optional({ nullable: true }).isString(),
  body('noteTitle').optional({ nullable: true }).isString(),
  body('custbody_me_wf_next_approver_blank').optional({ nullable: true }).isInt().withMessage('custbody_me_wf_next_approver_blank harus integer').toInt()
];

module.exports = {
  approvalValidation
};
