import { EntityManager } from 'typeorm';
import { Seat } from '../domain/entity/seat.entity';

export interface SeatRepository {
  getAvailableSeatsByPerformance(
    performanceId: number,
    manager?: EntityManager,
  ): Promise<Seat[]>;
  reserveSeat(
    seatId: number,
    userId: number,
    expire: Date,
    manager?: EntityManager,
  ): Promise<void>;
  updateSeatStatus(
    seatId: number,
    status: string,
    manager?: EntityManager,
  ): Promise<void>;
  getTempReservedSeat(
    performanceId: number,
    seatNumber: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<any>;

  findOneWithOptimisticLock(seatNumber: number, performanceId: number, version: number, manager?: EntityManager): Promise<Seat | null>;
  findOneByPerformanceAndSeatNumber(performanceId: number, seatNumber: number, manager?: EntityManager): Promise<Seat | null>;
  reserveSeatWithOptimisticLock(seat: Seat, manager?: EntityManager): Promise<Seat | null>;
}
