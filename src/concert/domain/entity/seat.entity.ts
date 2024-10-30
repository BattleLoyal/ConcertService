import { Version } from '@nestjs/common';
import { Entity, PrimaryGeneratedColumn, Column, VersionColumn } from 'typeorm';

@Entity('seat')
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

  @VersionColumn()
  version: number;
}