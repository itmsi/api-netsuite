const { pgCore: db } = require('../../config/database');

class EmailRepository {
  async getTemplateByCode(code) {
    return db('email_templates').where({ code, is_active: true }).first();
  }

  async enqueueEmail(data, trx = null) {
    const builder = trx ? db('email_queue').transacting(trx) : db('email_queue');
    const [result] = await builder.insert({
      template_id: data.template_id,
      to_email: data.to_email,
      cc_email: data.cc_email,
      subject: data.subject,
      payload: JSON.stringify(data.payload),
      attachments: JSON.stringify(data.attachments || []),
      status: 'PENDING'
    }).returning('*');
    return result;
  }

  async updateQueueStatus(id, status, error_message = null, processed_at = null) {
    const updateData = { status, updated_at: new Date() };
    if (error_message) updateData.error_message = error_message;
    if (processed_at) updateData.processed_at = processed_at;
    
    const [result] = await db('email_queue')
      .where({ id })
      .update(updateData)
      .returning('*');
    return result;
  }

  async incrementRetryCount(id) {
    const [result] = await db('email_queue')
      .where({ id })
      .increment('retry_count', 1)
      .update({ updated_at: new Date() })
      .returning('*');
    return result;
  }

  async createLog(data) {
    const [result] = await db('email_logs').insert(data).returning('*');
    return result;
  }
}

module.exports = new EmailRepository();
