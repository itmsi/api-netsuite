const { connectRabbitMQ } = require('../config/rabbitmq');
const { EXCHANGES, logger, todayFormat, sendAlert } = require('../utils');
const emailService = require('../modules/email/service');

const processEmailJob = async (payload, channel) => {
  try {
    const success = await emailService.processEmailJob(payload);
    if (!success) {
      console.warn(`[EmailNotificationListener] Job failed or requeued for ${payload.queue_id}`);
    }
  } catch (error) {
    await sendAlert({
      job: `email_notification_job_${payload?.subject}`,
      error,
      exceptions: JSON.stringify(error),
      details: error.toString()
    });
    console.error('[EmailNotificationListener] Critical error processing job:', error);
    // channel.close() if you want to close on critical error, but usually we just log
  }
};

const initEmailNotificationServices = async () => {
  const queueName = 'email_notification_queue';
  const exchangeName = EXCHANGES.EMAIL;
  const { channel, connection } = await connectRabbitMQ();
  
  process.once('SIGINT', async () => {
    console.info('[EmailNotificationListener] got sigint, closing connection');
    await channel.close();
    await connection.close();
    process.exit(0);
  });

  try {
    await channel.assertExchange(exchangeName, 'fanout', { durable: true });
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, exchangeName, '');
    
    await channel.prefetch(10);
    await channel.consume(
      queueName,
      async (msg) => {
        if (!msg) return;
        
        console.info(`[EmailNotificationListener] Processing data ${msg?.fields?.consumerTag}`);
        try {
          const parseData = JSON.parse(msg.content.toString());
          await processEmailJob(parseData, channel);
          logger('email-notification-services.txt', 'email').write(`Success consume-email-notification-${todayFormat('YYYY-MM-DD hh:mm:ss')}: ${JSON.stringify({ queue_id: parseData.queue_id, subject: parseData.subject })}\n`);
        } catch (error) {
          console.error('[EmailNotificationListener] error parsing/processing job', error);
          logger('email-notification-services.txt', 'email').write(`Failed consume-email-notification-${todayFormat('YYYY-MM-DD hh:mm:ss')}: ${JSON.stringify(error)}\n`);
        }
        channel.ack(msg);
      },
      {
        noAck: false,
        consumerTag: `consumer_${queueName}`
      }
    );
    console.info(`[EmailNotificationListener] Listening to queue: ${queueName}`);
  } catch (error) {
    console.error('[EmailNotificationListener] Initialization error:', error);
    logger('email-notification-services.txt', 'email').write(`Error init consume-email-notification-${todayFormat('YYYY-MM-DD hh:mm:ss')}: ${error.toString()}\n`);
  }
};

module.exports = {
  initEmailNotificationServices
};
