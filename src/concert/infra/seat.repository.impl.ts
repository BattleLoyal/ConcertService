import { Injectable, ConflictException } from '@nestjs/common';
import { EntityManager, UpdateResult, DataSource } from 'typeorm';
import { Seat } from '../domain/entity/seat.entity';
import { SeatRepository } from './seat.repository';

@Injectable()
export class SeatRepositoryImpl extends SeatRepository {
  constructor(private dataSource: DataSource) {
    super(Seat, dataSource.createEntityManager());
  }

  async getAvailableSeatsByPerformance(
    performanceId: number,
    manager?: EntityManager,
  ): Promise<Seat[]> {
    const entryManager = manager || this.manager;
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
    const entryManager = manager || this.manager;
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
  ): Promise<UpdateResult | void> {
    const entryManager = manager || this.manager;
    return await entryManager
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
  ): Promise<Seat | null> {
    const entryManager = manager || this.manager;
    const currentTime = new Date();

    return await entryManager
      .createQueryBuilder(Seat, 'seat')
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
    const entryManager = manager || this.manager;
    return await entryManager.findOne(Seat, {
      where: { performanceId, seatnumber: seatNumber, status: 'RESERVABLE' },
    });
  }

  // 낙관적 락을 사용하여 좌석 예약 상태 업데이트
  async reserveSeatWithOptimisticLock(
    seat: Seat,
    manager?: EntityManager,
  ): Promise<Seat | null> {
    try {
      const entryManager = manager || this.manager;

      // 낙관적 락의 version을 통한 update
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

  // 좌석 조회 - 비관적 락
  async findOneByPerformanceAndSeatNumberWithLock(
    performanceId: number,
    seatnumber: number,
    manager?: EntityManager,
  ): Promise<Seat | null> {
    const entryManager = manager || this.manager;
    return await entryManager.findOne(Seat, {
      where: { performanceId, seatnumber, status: 'RESERVABLE' },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async saveSeat(seatData: Partial<Seat>): Promise<Seat> {
    const seat = this.manager.create(Seat, seatData);
    return await this.manager.save(seat);
  }

  async updateSeatVersionStatus(
    seatId: number,
    status: string,
    version: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    const entryManager = manager || this.manager;
    const result = await entryManager.update(
      Seat,
      { seatId, version },
      { status, version: version + 1 },
    );
    return result.affected > 0;
  }
}
