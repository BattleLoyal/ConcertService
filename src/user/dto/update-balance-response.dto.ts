import { ApiProperty } from '@nestjs/swagger';

export class ChargeBalanceResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  newBalance: number;
}
