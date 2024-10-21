import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueService } from './service/queue.service';
import { QueueController } from './controller/queue.controller';
import { QueueRepositoryImpl } from './repository/queue.repository.impl';
import { Queue } from './entity/queue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Queue])],
  controllers: [QueueController],
  providers: [QueueService, QueueRepositoryImpl],
  exports: [QueueService],
})
export class QueueModule {}
