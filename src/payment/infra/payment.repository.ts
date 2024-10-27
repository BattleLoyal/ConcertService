import { EntityManager } from 'typeorm';

export interface PaymentRepository {
  insertPaymentRecord(
    userId: number,
    status: string,
    amount: number,
    manager: EntityManager,
  ): Promise<number>;
}
