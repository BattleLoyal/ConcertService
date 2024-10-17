import { ApiProperty } from '@nestjs/swagger';

export class AvailableSeatsDto {
  @ApiProperty()
  concertId: number;
  @ApiProperty()
  availableSeats: number[];
}
