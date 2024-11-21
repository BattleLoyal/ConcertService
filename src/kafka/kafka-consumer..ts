import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';

@Injectable()
export class KafkaConsumer implements OnModuleInit {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'my-consumer',
      brokers: ['localhost:9094'],
    });
    this.consumer = this.kafka.consumer({ groupId: 'my-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'order', fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`Received kafka message:`, {
          topic,
          partition,
          key: message.key?.toString(),
          value: message.value?.toString(),
        });
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
