import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueService } from './application/queue.service';
import { QueueController } from './interface/queue.controller';
import { QueueRepositoryImpl } from './infra/queue.repository.impl';
import { Queue } from './domain/entity/queue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Queue])],
  controllers: [QueueController],
  providers: [QueueService, QueueRepositoryImpl],
  exports: [QueueService],
})
export class QueueModule {}
