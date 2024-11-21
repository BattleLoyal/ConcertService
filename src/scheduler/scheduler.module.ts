import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Queue } from '../queue/domain/entity/queue.entity';
import { Seat } from '../concert/domain/entity/seat.entity';
import { SchedulerService } from './scheduler.service';
import { OutboxModule } from 'src/common/outbox/outbox.module';
import { KafkaProducer } from 'src/kafka/kafka-producer';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Queue, Seat]),
    OutboxModule,
  ],
  providers: [SchedulerService, KafkaProducer],
  exports: [SchedulerService],
})
export class SchedulerModule {}
