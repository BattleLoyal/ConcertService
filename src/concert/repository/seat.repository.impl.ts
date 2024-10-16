import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Seat } from '../entity/seat.entity';
import { SeatRepository } from './seat.repository';

@Injectable()
export class SeatRepositoryImpl implements SeatRepository {
  constructor(private readonly entityManager: EntityManager) {}

  async getAvailableSeatsByPerformance(
    performanceId: number,
    manager?: EntityManager,
  ): Promise<Seat[]> {
    const entryManager = manager || this.entityManager;
    return await entryManager
      .createQueryBuilder(Seat, 'seat')
      .where('seat.performanceId = :performanceId', { performanceId })
      .andWhere('seat.status = :status', { status: 'RESERVABLE' })
      .getMany();
  }

  // 좌석 임시 예약
  async reserveSeat(
    seatId: number,
    userId: number,
    expire: Date,
    manager?: EntityManager,
  ): Promise<void> {
    const entryManager = manager || this.entityManager;
    await entryManager
      .createQueryBuilder()
      .update(Seat)
      .set({
        userId,
        status: 'TEMP',
        expire,
      })
      .where('seatid = :seatId', { seatId })
      .andWhere('seat.status = :status', { status: 'RESERVABLE' })
      .execute();
  }
}
