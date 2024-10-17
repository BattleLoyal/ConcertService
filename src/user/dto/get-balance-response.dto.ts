import { ApiProperty } from '@nestjs/swagger';

export class GetBalanceResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  balance: number;
}
