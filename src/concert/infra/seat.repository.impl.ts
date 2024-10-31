import { Injectable, ConflictException } from '@nestjs/common';
import {
  EntityManager,
  OptimisticLockVersionMismatchError,
  UpdateResult,
} from 'typeorm';
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

  // 좌석 조회 - 예약 가능한 상태인지 확인
  async findOneByPerformanceAndSeatNumber(
    performanceId: number,
    seatNumber: number,
    manager?: EntityManager,
  ): Promise<Seat | null> {
    const entryManager = manager || this.entityManager;
    return await entryManager.findOne(Seat, {
      where: { performanceId, seatnumber: seatNumber, status: 'RESERVABLE' },
    });
  }

  async findOneWithOptimisticLock(
    seatNumber: number,
    performanceId: number,
    version: number,
    manager?: EntityManager,
  ): Promise<Seat | null> {
    const entryManager = manager || this.entityManager;
    return await entryManager.findOne(Seat, {
      where: { seatnumber: seatNumber, performanceId, status: 'RESERVABLE' },
      lock: { mode: 'optimistic', version },
    });
  }

  // 낙관적 락을 사용하여 좌석 예약 상태 업데이트
  async reserveSeatWithOptimisticLock(
    seat: Seat,
    manager?: EntityManager,
  ): Promise<Seat | null> {
    try {
      const entryManager = manager || this.entityManager;

      // `seatid`와 `version` 값을 조건으로 하는 `update` 쿼리 실행
      const updateResult: UpdateResult = await entryManager.update(
        Seat,
        { seatid: seat.seatid, version: seat.version },
        {
          status: 'TEMP',
          expire: seat.expire,
          userId: seat.userId,
          version: seat.version + 1,
        },
      );

      // 업데이트가 성공적으로 이루어졌는지 확인
      if (updateResult.affected === 0) {
        throw new ConflictException('다른 사용자가 이미 예약했습니다.');
      }

      // 업데이트된 seat 반환
      return await entryManager.findOne(Seat, {
        where: { seatid: seat.seatid },
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('좌석 예약 중 문제가 발생했습니다.');
    }
  }

  async saveSeat(seatData: Partial<Seat>): Promise<Seat> {
    const seat = this.entityManager.create(Seat, seatData);
    return await this.entityManager.save(seat);
  }
}
