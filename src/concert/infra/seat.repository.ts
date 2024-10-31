import { EntityManager, UpdateResult, Repository } from 'typeorm';
import { Seat } from '../domain/entity/seat.entity';

export abstract class SeatRepository extends Repository<Seat> {
  abstract getAvailableSeatsByPerformance(
    performanceId: number,
    manager?: EntityManager,
  ): Promise<Seat[]>;
  abstract reserveSeat(
    seatId: number,
    userId: number,
    expire: Date,
    manager?: EntityManager,
  ): Promise<void>;
  abstract updateSeatStatus(
    seatId: number,
    status: string,
    manager?: EntityManager,
  ): Promise<UpdateResult | void>;
  abstract getTempReservedSeat(
    performanceId: number,
    seatNumber: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<Seat | null>;
  abstract findOneByPerformanceAndSeatNumber(
    performanceId: number,
    seatNumber: number,
    manager?: EntityManager,
  ): Promise<Seat | null>;
  abstract reserveSeatWithOptimisticLock(
    seat: Seat,
    manager?: EntityManager,
  ): Promise<Seat | null>;
  abstract findOneByPerformanceAndSeatNumberWithLock(
    performanceId: number,
    seatnumber: number,
    manager: EntityManager,
  ): Promise<Seat | null>;
  abstract updateSeatVersionStatus(
    seatId: number,
    status: string,
    version: number,
    manager?: EntityManager,
  ): Promise<boolean>;
}
