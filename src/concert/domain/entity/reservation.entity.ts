import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('reservation')
export class Reservation {
  @PrimaryGeneratedColumn()
  reservationid: number;

  @Column()
  seatid: number;

  @Column()
  userid: number;

  @Column()
  paymentid: number;
}
