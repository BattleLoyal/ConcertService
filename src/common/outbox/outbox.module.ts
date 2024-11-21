import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEntity } from './outbox.entity';
import { OutboxRepository } from './outbox.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity])],
  providers: [OutboxRepository],
  exports: [OutboxRepository],
})
export class OutboxModule {}
