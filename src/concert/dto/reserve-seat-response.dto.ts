import { ApiProperty } from '@nestjs/swagger';

export class ReserveSeatResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  concertId: number;

  @ApiProperty()
  date: string;

  @ApiProperty()
  seatNumber: number;

  @ApiProperty()
  expireTime: string;
}
