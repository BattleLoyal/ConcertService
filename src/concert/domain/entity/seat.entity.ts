import { Version } from '@nestjs/common';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  VersionColumn,
  Index,
} from 'typeorm';

@Entity('seat')
@Index('IDX_PERFORMANCE_SEAT', ['performanceId', 'seatnumber'])
export class Seat {
  @PrimaryGeneratedColumn()
  seatid: number;

  @Column()
  performanceId: number;

  @Column()
  seatnumber: number;

  @Column({ nullable: true })
  userId?: number;

  @Column()
  price: number;

  @Column()
  status: string;

  @Column({ type: 'datetime', nullable: true })
  expire?: Date;

  // 낙관적 락을 위한 버전 관리
  @VersionColumn()
  version: number;
}
