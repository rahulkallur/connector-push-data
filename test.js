import pkg from "kafkajs";
const { Kafka } = pkg;
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

// Create the client with the broker list, minimum 1 broker(bootstrap) is needed
// The client will auto-fetch the metadata of others
const kafka = new Kafka({
  clientId: "push-data-service-" + Date.now(), // Append Current Epoch milliseconds for Random Id
  brokers: [
    process.env.KAFKA_BOOTSTRAP_SERVER_URL ||
      "my-cluster-kafka-bootstrap.kafka:9092",
  ],
  sasl: {
    mechanism: "scram-sha-512",
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
});

// Consumer
const consumerData = kafka.consumer({
  groupId: "push-data-service-group-kinesis",
});

// Producer
// const producer = kafka.producer();

const run = async () => {
  await consumerData.connect();
//   await producer.connect();
  console.info("Connected to Kafka Broker.");
  await consumerData.subscribe({
    topic: process.env.SUBSCRIBE_TOPIC,
    fromBeginning: false,
  });

  consumerData.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        let payLoadParsed = JSON.parse(message.value.toString());
        console.log("PayloadParsed:",payLoadParsed)
      } catch (error) {
        console.log("Eror: ",error);
      }
    },
  });
};

run().catch("run error: ", console.error);

// Consumer Crash Events
consumerData.on("consumer.crash", function () {
  console.log("Crash detected");
  process.exit(0);
});

consumerData.on("consumer.disconnect", function () {
  console.log("Disconnect detected");
  process.exit(0);
});

consumerData.on("consumer.stop", function () {
  console.log("Stop detected");
  process.exit(0);
});

const errorTypes = ["unhandledRejection"];

errorTypes.map((type) => {
  process.on(type, async (e) => {
    console.log(`process.on ${type}`);
    console.error(e);
    // await consumer.disconnect()
    process.exit(0);
  });
});
