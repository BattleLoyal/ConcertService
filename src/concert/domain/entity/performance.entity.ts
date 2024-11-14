import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('performance')
export class Performance {
  @PrimaryGeneratedColumn()
  performanceid: number;

  @Column()
  @Index()
  concertid: number;

  @Column({ type: 'date' })
  date: Date;
}
