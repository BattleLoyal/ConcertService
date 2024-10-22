import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Seat } from '../domain/entity/seat.entity';
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

  // 좌석 상태 업데이트
  async updateSeatStatus(
    seatId: number,
    status: string,
    manager?: EntityManager,
  ): Promise<void> {
    const entryManager = manager || this.entityManager;
    await entryManager
      .createQueryBuilder()
      .update('seat')
      .set({ status })
      .where('seatid = :seatId', { seatId })
      .execute();
  }

  // 임시 예약된 좌석 확인
  async getTempReservedSeat(
    performanceId: number,
    seatNumber: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<any> {
    const entryManager = manager || this.entityManager;
    const currentTime = new Date();

    return await entryManager
      .createQueryBuilder('seat', 'seat')
      .where('seat.performanceId = :performanceId', { performanceId })
      .andWhere('seat.seatnumber = :seatNumber', { seatNumber })
      .andWhere('seat.userId = :userId', { userId })
      .andWhere('seat.status = :status', { status: 'TEMP' })
      .andWhere('seat.expire > :currentTime', { currentTime })
      .getOne();
  }
}
