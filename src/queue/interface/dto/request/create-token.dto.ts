import { ApiProperty } from '@nestjs/swagger';

export class CreateTokenDto {
  @ApiProperty()
  userId: number;
}
