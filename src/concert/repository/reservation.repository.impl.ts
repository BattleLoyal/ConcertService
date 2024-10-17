import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ReservationRepository } from './reservation.repository';

@Injectable()
export class ReservationRepositoryImpl implements ReservationRepository {
  constructor(private readonly entityManager: EntityManager) {}

  // 예약 기록 삽입
  async insertReservation(
    seatId: number,
    userId: number,
    paymentId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const entity = manager || this.entityManager;
    await entity
      .createQueryBuilder()
      .insert()
      .into('reservation')
      .values({ seatid: seatId, userid: userId, paymentid: paymentId })
      .execute();
  }
}
