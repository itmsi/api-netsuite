const service = require('./service');


const enqueueEmail = async (req, res, next) => {
  console.log("Masuk Controller email ")
  try {
    const { template_code, to_email, cc_email, data, attachments } = req.body;

    // Basic validation
    if (!to_email || !data) {
      return res.status(400).json({
        status: false,
        message: 'Missing required fields: to_email, data'
      });
    }

    const result = await service.enqueueEmail({
      template_code,
      to_email,
      cc_email,
      data,
      attachments
    });

    return res.status(200).json({
      status: true,
      message: 'Email notification queued successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enqueueEmail
};
