import { EntityManager } from 'typeorm';

export interface ReservationRepository {
  insertReservation(
    seatId: number,
    userId: number,
    paymentId: number,
    manager?: EntityManager,
  ): Promise<void>;
}
