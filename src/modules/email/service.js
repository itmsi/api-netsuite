const repository = require('./repository');
const { publishToRabbitMqQueueSingle } = require('../../config/rabbitmq');
const { EXCHANGES } = require('../../utils/constant');
const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

class EmailService {
  /**
   * Request to send email. Enqueues job to DB and RabbitMQ.
   * @param {Object} payload 
   * @param {string} payload.template_code
   * @param {string} payload.to_email
   * @param {string} payload.cc_email
   * @param {Object} payload.data
   * @param {Array} payload.attachments
   */
  async enqueueEmail(payload) {
    try {
      // 1. Get Template from DB
      let template = null;
      if (payload.template_code) {
        template = await repository.getTemplateByCode(payload.template_code);
      }
      
      // Fallback to default file template if not found in DB or not provided
      if (!template) {
        const defaultTemplatePath = path.join(__dirname, 'templates', 'po_approval_reminder.html');
        const defaultHtmlContent = fs.readFileSync(defaultTemplatePath, 'utf8');
        template = {
          id: null,
          code: payload.template_code || 'DEFAULT_TEMPLATE',
          subject: payload.data?.subject || 'Notification Reminder',
          html_content: defaultHtmlContent
        };
      }

      // 2. Prepare queue data
      const queueData = {
        template_id: template.id,
        to_email: payload.to_email,
        cc_email: payload.cc_email,
        subject: template.subject,
        payload: payload.data,
        attachments: payload.attachments || []
      };

      // 3. Save to database queue
      const queueEntry = await repository.enqueueEmail(queueData);

      // 4. Publish to RabbitMQ
      const rabbitPayload = {
        queue_id: queueEntry.id,
        template_code: template.code,
        html_content: template.html_content,
        subject: template.subject,
        to: payload.to_email,
        cc: payload.cc_email,
        data: payload.data,
        attachments: payload.attachments,
        retry_count: 0
      };

      await publishToRabbitMqQueueSingle(EXCHANGES.EMAIL, 'email_notification_queue', rabbitPayload);

      return {
        status: true,
        message: 'Email successfully enqueued',
        queue_id: queueEntry.id
      };
    } catch (error) {
      console.error('[EmailService] Error enqueueing email:', error);
      throw error;
    }
  }

  /**
   * Process email sending (called by worker)
   */
  async processEmailJob(jobData) {
    const smtpProvider = require('./providers/smtp_provider');
    const { queue_id, html_content, subject, to, cc, data, attachments, retry_count } = jobData;

    try {
      // Update status to processing
      await repository.updateQueueStatus(queue_id, 'PROCESSING');

      // Compile template
      const compiledTemplate = Handlebars.compile(html_content);
      const html = compiledTemplate(data);
      const compiledSubject = Handlebars.compile(subject)(data);

      // Send via SMTP
      const sendResult = await smtpProvider.sendMail({
        to,
        cc,
        subject: compiledSubject,
        html,
        attachments
      });

      // Update queue status
      await repository.updateQueueStatus(queue_id, 'COMPLETED', null, new Date());

      // Create log
      await repository.createLog({
        queue_id,
        provider_used: sendResult.provider,
        message_id: sendResult.messageId,
        status: 'SUCCESS',
        response_details: JSON.stringify(sendResult.response)
      });

      return true;
    } catch (error) {
      console.error(`[EmailService] Failed to process email job ${queue_id}:`, error.message);
      
      const newRetryCount = (retry_count || 0) + 1;
      const maxRetries = parseInt(process.env.EMAIL_MAX_RETRIES || '3');

      if (newRetryCount <= maxRetries) {
        // Increment retry in DB
        await repository.incrementRetryCount(queue_id);
        await repository.updateQueueStatus(queue_id, 'PENDING', error.message);
        
        // Requeue with increased retry count
        const rabbitPayload = { ...jobData, retry_count: newRetryCount };
        await publishToRabbitMqQueueSingle(EXCHANGES.EMAIL, 'email_notification_queue', rabbitPayload);
      } else {
        // Max retries reached
        await repository.updateQueueStatus(queue_id, 'FAILED', error.message, new Date());
        
        // Create failed log
        await repository.createLog({
          queue_id,
          provider_used: process.env.SMTP_PROVIDER || 'custom',
          status: 'FAILED',
          response_details: error.message
        });
      }
      return false;
    }
  }
}

module.exports = new EmailService();
