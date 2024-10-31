import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PaymentRepository } from './payment.repository';
import { Payment } from 'src/payment/domain/entity/payment.entity';

@Injectable()
export class PaymentRepositoryImpl implements PaymentRepository {
  constructor(private readonly entityManager: EntityManager) {}

  // 결제 기록 삽입 (paytime에 날짜와 시간을 함께 저장)
  async insertPaymentRecord(
    userId: number,
    status: string,
    amount: number,
    manager?: EntityManager,
  ): Promise<number> {
    const entity = manager || this.entityManager;
    const result = await entity
      .createQueryBuilder(Payment, 'payment')
      .insert()
      .into('Payment')
      .values({
        userId,
        status,
        amount,
        paytime: new Date(),
      })
      .execute();

    return result.identifiers[0].paymentid;
  }
}
