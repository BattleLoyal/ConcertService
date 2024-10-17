import { ApiProperty } from '@nestjs/swagger';

export class ReserveSeatDto {
  @ApiProperty()
  userId: number;
  @ApiProperty()
  date: string;
  @ApiProperty()
  seatNumber: number;
}
