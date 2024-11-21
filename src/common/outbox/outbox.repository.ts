import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OutboxEntity } from './outbox.entity';

@Injectable()
export class OutboxRepository {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly repository: Repository<OutboxEntity>,
  ) {}

  async saveOutboxMessage(topic: string, payload: string): Promise<void> {
    const outbox = this.repository.create({ topic, payload, processed: false });
    await this.repository.save(outbox);
  }

  async getUnprocessedMessages(): Promise<OutboxEntity[]> {
    return this.repository.find({ where: { processed: false } });
  }

  async markAsProcessed(id: number): Promise<void> {
    await this.repository.update(id, { processed: true });
  }
}
