import { Controller, Patch, Body, Param, Get } from '@nestjs/common';
import { UserService } from '../../application/user.service';
import { UpdateBalanceDto } from './update-balance.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { ChargeBalanceResponseDto } from './update-balance-response.dto';
import { GetBalanceResponseDto } from './get-balance-response.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch(':id/balance')
  @ApiOperation({ summary: '잔액 충전', description: '잔액을 충전합니다.' })
  @ApiParam({ name: 'id', description: '유저 ID', example: 1 })
  @ApiBody({ type: UpdateBalanceDto })
  @ApiResponse({
    status: 200,
    description: '잔액 충전 성공',
    type: ChargeBalanceResponseDto,
  })
  async chargeBalance(
    @Param('id') userId: number,
    @Body() updateBalanceDto: UpdateBalanceDto,
  ): Promise<ChargeBalanceResponseDto> {
    return this.userService.chargeBalanceWithOptimisticLock(
      userId,
      updateBalanceDto.amount,
    );
  }

  @Get(':id/balance')
  @ApiOperation({
    summary: '잔액 조회',
    description: '현재 잔액을 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '유저 ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '잔액 조회 성공',
    type: GetBalanceResponseDto,
  })
  async getUserBalance(
    @Param('id') userId: number,
  ): Promise<GetBalanceResponseDto> {
    return this.userService.getUserBalance(userId);
  }
}
