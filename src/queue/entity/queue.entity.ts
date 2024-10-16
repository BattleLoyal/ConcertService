import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('queue')
export class Queue {
  @PrimaryGeneratedColumn()
  order: number;

  @Column()
  UserID: number;

  @Column()
  UUID: string;

  @Column()
  status: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdtime: Date;

  @Column({ type: 'timestamp', nullable: true })
  activatedtime?: Date;
}
