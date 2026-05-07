const amqp = require('amqplib');
const { lang } = require('../lang');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    return { connection, channel };
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    throw error;
  }
};

const publishToRabbitMqQueueSingle = async (exchangeName, queueName, data, queueOptions = { durable: true }) => {
  const config = await connectRabbitMQ()

  try {
    if (config?.connection && config?.channel) {
      await config?.channel.assertExchange(exchangeName, 'fanout', { durable: true })
      await config?.channel.assertQueue(queueName, queueOptions)
      await config?.channel.bindQueue(queueName, exchangeName, '')

      const stringifiedData = JSON.stringify(data);
      config?.channel.publish(exchangeName, '', Buffer.from(stringifiedData))
      console.info(lang.__('rabbitmq.publish'))
    } else {
      console.info(`failed to publish ${exchangeName} - ${queueName}`, config?.error)
    }
  } catch (e) {
    console.error(lang.__('rabbitmq.error'), e)
  } finally {
    try {
      console.info(lang.__('rabbitmq.closing'))
      if (config?.channel) await config.channel.close()
      if (config?.connection) await config.connection.close()
      console.info(lang.__('rabbitmq.closed'))
    } catch (closeErr) {
      console.warn('Error closing RabbitMQ connection:', closeErr.message)
    }
  }
}

module.exports = {
  connectRabbitMQ,
  publishToRabbitMqQueueSingle
}
