import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty()
  userId: number;
  @ApiProperty()
  concertId: number;
  @ApiProperty()
  date: string;
  @ApiProperty()
  seatNumber: number;
}
