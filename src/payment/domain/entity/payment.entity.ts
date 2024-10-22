import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('payment')
export class Payment {
  @PrimaryGeneratedColumn()
  paymentid: number;

  @Column()
  userId: number;

  @Column()
  status: string; // 결제 상태

  @Column()
  amount: number; // 결제 금액

  @Column({ type: 'datetime' })
  paytime: Date; // 결제 시간
}
