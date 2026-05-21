const nodemailer = require('nodemailer');

class SmtpProvider {
  constructor() {
    this.provider = process.env.SMTP_PROVIDER || 'custom';

    const config = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    // Preset configurations for specific providers if needed
    if (this.provider === 'gmail') {
      config.host = 'smtp.gmail.com';
    } else if (this.provider === 'mailtrap') {
      config.host = 'sandbox.smtp.mailtrap.io';
    } else if (this.provider === 'zoho') {
      config.host = 'smtp.zoho.com';
    } else if (this.provider === 'sender.net') {
      config.host = 'smtp.sender.net';
    }

    this.transporter = nodemailer.createTransport(config);
  }

  async sendMail({ to, cc, subject, html, attachments }) {
    const fromName = process.env.APP_NAME || 'Netsuite MSI';
    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      cc,
      subject,
      html,
      attachments,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        provider: this.provider,
        response: info.response,
      };
    } catch (error) {
      console.error(`[SmtpProvider] Error sending email via ${this.provider}:`, error.message);
      throw error;
    }
  }
}

module.exports = new SmtpProvider();
