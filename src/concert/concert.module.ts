import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConcertController } from './concert.controller';
import { ConcertService } from './concert.service';
import { Concert } from './entity/concert.entity';
import { Performance } from './entity/performance.entity';
import { PerformanceRepositoryImpl } from './repository/performance.repository.impl';
import { QueueRepositoryImpl } from '../queue/repository/queue.repository.impl';

@Module({
  imports: [TypeOrmModule.forFeature([Concert, Performance])],
  controllers: [ConcertController],
  providers: [ConcertService, PerformanceRepositoryImpl, QueueRepositoryImpl], // QueueRepository 추가
})
export class ConcertModule {}
