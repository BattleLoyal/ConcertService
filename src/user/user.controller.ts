import { Controller, Post, Patch, Body, Res, Req, Param, Get } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('user')
export class UserController {
  @Patch(':id/charge-balance')
  chargeBalance(
    @Param('id') userId: string, @Body() body: any, @Res() response: Response): any {
    const { amount } = body;
    if (amount && userId) {
      return response.status(200).json({
          userId,
          newBalance: 3000,
      });
    }
    else {
      return response.status(500);
    }
  }

  @Get(':id/balance')
  getBalance(
    @Param('id') userId: string, @Res() response: Response): any {
    if (userId) {
      return response.status(200).json({
          userId,
          balance: 3000,
      });
    }
    else {
      return response.status(500);
    }
  }

}
