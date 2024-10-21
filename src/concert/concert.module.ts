import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConcertController } from './controller/concert.controller';
import { ConcertService } from './service/concert.service';
import { Concert } from './entity/concert.entity';
import { Performance } from './entity/performance.entity';
import { PerformanceRepositoryImpl } from './repository/performance.repository.impl';
import { QueueRepositoryImpl } from '../queue/repository/queue.repository.impl';
import { Seat } from './entity/seat.entity';
import { SeatRepositoryImpl } from './repository/seat.repository.impl';
import { Reservation } from './entity/reservation.entity';
import { ReservationRepositoryImpl } from './repository/reservation.repository.impl';

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
