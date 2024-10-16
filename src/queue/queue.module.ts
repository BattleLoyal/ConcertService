import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueRepositoryImpl } from './repository/queue.repository.impl';
import { Queue } from './entity/queue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Queue])],
  controllers: [QueueController],
  providers: [QueueService, QueueRepositoryImpl],
  exports: [QueueService],
})
export class QueueModule {}
