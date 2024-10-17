import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('performance')
export class Performance {
  @PrimaryGeneratedColumn()
  performanceid: number;

  @Column()
  concertid: number;

  @Column({ type: 'date' })
  date: Date;
}
