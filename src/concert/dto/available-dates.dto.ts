import { ApiProperty } from '@nestjs/swagger';

export class AvailableDatesDto {
  @ApiProperty()
  availableDates: string[];
}
