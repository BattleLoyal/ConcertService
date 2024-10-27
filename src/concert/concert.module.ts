import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConcertController } from './interface/concert.controller';
import { ConcertService } from './application/service/concert.service';
import { Concert } from './domain/entity/concert.entity';
import { Performance } from './domain/entity/performance.entity';
import { PerformanceRepositoryImpl } from './infra/performance.repository.impl';
import { QueueRepositoryImpl } from '../queue/infra/queue.repository.impl';
import { Seat } from './domain/entity/seat.entity';
import { SeatRepositoryImpl } from './infra/seat.repository.impl';
import { Reservation } from './domain/entity/reservation.entity';
import { ReservationRepositoryImpl } from './infra/reservation.repository.impl';

@Module({
  imports: [
    TypeOrmModule.forFeature([Concert, Performance, Seat, Reservation]),
  ],
  controllers: [ConcertController],
  providers: [
    ConcertService,
    PerformanceRepositoryImpl,
    QueueRepositoryImpl,
    SeatRepositoryImpl,
    ReservationRepositoryImpl,
  ],
})
export class ConcertModule {}
