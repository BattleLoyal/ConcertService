import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Partitioners } from 'kafkajs';

@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false; // 연결 상태 확인

  constructor() {
    this.kafka = new Kafka({
      clientId: 'my-producer',
      brokers: [process.env.KAFKA_HOST], // Kafka 브로커 주소
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    if (!this.isConnected) {
      await this.connectProducer();
    }
  }

  private async connectProducer() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('Kafka Producer connected');
    } catch (error) {
      console.error('Error connecting Kafka Producer:', error.message);
      throw error;
    }
  }

  async send(topic: string, messages: any[]) {
    if (!this.isConnected) {
      console.log('Kafka Producer is not connected. Attempting to connect...');
      await this.connectProducer();
    }

    await this.producer.send({
      topic,
      messages: messages.map((message) => ({ value: JSON.stringify(message) })),
    });
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }
}
