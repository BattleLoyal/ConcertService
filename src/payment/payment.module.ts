import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './application/service/payment.service';
import { PaymentController } from './interface/payment.controller';
import { PaymentRepositoryImpl } from './infra/payment.repository.impl';
import { UserRepositoryImpl } from '../user/infra/user.repository.impl';
import { SeatRepositoryImpl } from '../concert/infra/seat.repository.impl';
import { QueueRepositoryImpl } from '../queue/infra/queue.repository.impl';
import { ReservationRepositoryImpl } from '../concert/infra/reservation.repository.impl';
import { Payment } from './domain/entity/payment.entity';
import { User } from '../user/domain/entity/user.entity';
import { Seat } from '../concert/domain/entity/seat.entity';
import { Queue } from '../queue/domain/entity/queue.entity';
import { Reservation } from '../concert/domain/entity/reservation.entity';
import { PerformanceRepositoryImpl } from 'src/concert/infra/performance.repository.impl';
import { KafkaProducer } from 'src/kafka/kafka-producer';

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
    KafkaProducer,
  ],
  controllers: [PaymentController],
})
export class PaymentModule {}
