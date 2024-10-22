import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('concert')
export class Concert {
  @PrimaryGeneratedColumn()
  concertid: number;

  @Column()
  title: string;

  @Column()
  singer: string;

  @Column()
  location: string;
}
