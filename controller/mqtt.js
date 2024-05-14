require('dotenv').config();
const amqp = require('amqplib');
const brokerUrl = `amqp://${process.env.MQTT_USERNAME}:${process.env.MQTT_PASSWORD}@${process.env.MQTT_HOSTNAME}`;
const queue = `${process.env.MQTT_QUEUE}`;

// Connect to RabbitMQ
async function connectToRabbitMQ(data) {
  try {
    const connection = await amqp.connect(brokerUrl);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue);
    console.log('Connected to RabbitMQ');
    const message = JSON.stringify(data);
    await channel.sendToQueue(queue,Buffer.from(message))
    console.log(`Send Message to RabbitMQ : ${message}`);
  
    await channel.close()
    console.log('Close Channel RabbitMQ');
    await connection.close()
    console.log('Close Connected RabbitMQ');

  } catch (error) {
    throw new Error('Error connecting to RabbitMQ: ' + error.message);
  }
};
//see data
async function waitData() {
    try {
      const connection = await amqp.connect(brokerUrl);
      const channel = await connection.createChannel();
      await channel.assertQueue(queue);
      console.log('wait to RabbitMQ');
  
      channel.consume(queue, (msg) => {
        if (msg !== null) {
          console.log('Recieved:', msg.content.toString());
          channel.ack(msg);
        } else {
          console.log('Consumer cancelled by server');
        }
      });
  
    } catch (error) {
      throw new Error('Error connecting to RabbitMQ: ' + error.message);
    }
  };

module.exports = {
    connectToRabbitMQ,
    waitData
}