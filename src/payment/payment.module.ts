import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './service/payment.service';
import { PaymentController } from './controller/payment.controller';
import { PaymentRepositoryImpl } from './repository/payment.repository.impl';
import { UserRepositoryImpl } from '../user/repository/user.repository.impl';
import { SeatRepositoryImpl } from '../concert/repository/seat.repository.impl';
import { QueueRepositoryImpl } from '../queue/repository/queue.repository.impl';
import { ReservationRepositoryImpl } from '../concert/repository/reservation.repository.impl';
import { Payment } from './entity/payment.entity';
import { User } from '../user/entity/user.entity';
import { Seat } from '../concert/entity/seat.entity';
import { Queue } from '../queue/entity/queue.entity';
import { Reservation } from '../concert/entity/reservation.entity';
import { PerformanceRepositoryImpl } from 'src/concert/repository/performance.repository.impl';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      User,
      Seat,
      Queue,
      Reservation,
      Performance,
    ]),
  ],
  providers: [
    PaymentService,
    PaymentRepositoryImpl,
    UserRepositoryImpl,
    SeatRepositoryImpl,
    QueueRepositoryImpl,
    ReservationRepositoryImpl,
    PerformanceRepositoryImpl,
  ],
  controllers: [PaymentController],
})
export class PaymentModule {}
