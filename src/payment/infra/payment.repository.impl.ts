import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Payment } from 'src/payment/domain/entity/payment.entity';
import { PaymentRepository } from './payment.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class PaymentRepositoryImpl extends PaymentRepository {
  constructor(private dataSource: DataSource) {
    super(Payment, dataSource.createEntityManager());
  }

  async insertPaymentRecord(
    userId: number,
    status: string,
    amount: number,
    manager: EntityManager,
  ): Promise<number> {
    const result = await manager.save(Payment, {
      userId,
      status,
      amount,
      paytime: new Date(),
    });

    return result.paymentid;
  }
}
