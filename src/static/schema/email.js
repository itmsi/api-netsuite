const emailSchemas = {
  EmailSendRequest: {
    type: 'object',
    required: ['to_email', 'data'],
    properties: {
      template_code: {
        type: 'string',
        example: 'PO_APPROVAL_REMINDER',
        description: 'Code of the template to be used from email_templates table'
      },
      to_email: {
        type: 'string',
        example: 'customer@example.com',
        description: 'Recipient email address'
      },
      cc_email: {
        type: 'string',
        example: 'manager@example.com',
        description: 'CC email address'
      },
      data: {
        type: 'object',
        example: {
          customer_name: 'Customer A',
          notifications: [
            { type: 'PO Approval', doc_no: 'PO-1001' },
            { type: 'Task Reminder', doc_no: 'TSK-002' }
          ]
        },
        description: 'Dynamic data used to inject variables into the Handlebars/HTML template'
      },
      attachments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              example: 'invoice.pdf'
            },
            path: {
              type: 'string',
              example: '/path/to/invoice.pdf'
            }
          }
        },
        description: 'Optional array of attachments to send with the email'
      }
    }
  }
};

module.exports = emailSchemas;
