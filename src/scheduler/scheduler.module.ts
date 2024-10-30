import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Queue } from '../queue/domain/entity/queue.entity';
import { Seat } from '../concert/domain/entity/seat.entity';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Queue, Seat])],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
