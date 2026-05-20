const emailPaths = {
  '/email/send': {
    post: {
      tags: ['Email Notification'],
      summary: 'Enqueue email for background sending',
      description: 'Enqueue an email payload that will be processed and sent by the RabbitMQ background worker using the provided template code and dynamic data.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/EmailSendRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Email successfully enqueued',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Email notification queued successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      queue_id: { type: 'string', format: 'uuid', example: 'uuid-1234-5678' }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request (Missing required fields)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  }
};

module.exports = emailPaths;
