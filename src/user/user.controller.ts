import { Controller, Patch, Body, Res, Param, Get } from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { UpdateBalanceDto } from './dto/update-balance.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch(':id/balance')
  async chargeBalance(
    @Param('id') userId: number,
    @Body() updateBalanceDto: UpdateBalanceDto,
  ): Promise<any> {
    return this.userService.chargeBalance(userId, updateBalanceDto);
  }

  @Get(':id/balance')
  async getUserBalance(@Param('id') userId: number): Promise<any> {
    return this.userService.getUserBalance(userId);
  }
}
