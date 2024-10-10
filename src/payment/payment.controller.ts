import { Controller, Get, Post, Param, Query, Res, Body } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('payment')
export class PaymentController {
  @Post()
  payment(
    @Body() body: any,
    @Res() response: Response,
  ): any {
    const { userId, concertId, date, seatNumber } = body;
    if (userId && concertId && date && seatNumber) {
      return response.status(200).json({
        status: "Success",
        tokenState: "Expired",
        userId,
        concertId,
        date,
        seatNumber,
        amount: 10000,
        balance: 5000,
      });
    } else {
      return response.status(500);
    }
  }
}
