import { EntityManager, Repository } from 'typeorm';
import { Payment } from 'src/payment/domain/entity/payment.entity';

export abstract class PaymentRepository extends Repository<Payment> {
  abstract insertPaymentRecord(
    userId: number,
    status: string,
    amount: number,
    manager: EntityManager,
  ): Promise<number>;
}
