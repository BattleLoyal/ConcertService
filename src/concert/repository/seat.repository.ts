import { EntityManager } from 'typeorm';
import { Seat } from '../entity/seat.entity';

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
}
