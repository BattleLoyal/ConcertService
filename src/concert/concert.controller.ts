import { Controller, Get, Post, Param, Query, Res, Body } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('concert')
export class ConcertController {
  @Get(':id/date')
  getAvailableDates(
    @Param('id') concertId: string,
    @Query('date') date: string,
    @Res() response: Response,
  ): any {
    if (concertId && date) {
      const availableDates = [
        '2024-10-13',
        '2024-10-15',
        '2024-10-18',
        '2024-10-20',
      ];

      return response.status(200).json({
        concertId: Number(concertId),
        availableDates: availableDates,
      });
    } else {
      return response.status(500);
    }
  }

  @Get(':id/seat')
  getAvailableSeats(
    @Param('id') concertId: string,
    @Query('date') date: string,
    @Res() response: Response,
  ): any {
    if (concertId && date) {
      const availableSeats = [
        1,
        4,
        15,
        21,
        45,
      ];

      return response.status(200).json({
        concertId: Number(concertId),
        availableSeats: availableSeats,
      });
    } else {
      return response.status(500);
    }
  }

  @Post(':id/reserve-seat')
  reserveSeat(
    @Param('id') concertId: string,
    @Body() body: any,
    @Res() response: Response,
  ): any {
    const { userId, date, seatNumber } = body;

    if (userId && concertId && date && seatNumber) {
      return response.status(200).json({
        userId,
        concertId: Number(concertId),
        date,
        seatNumber,
        tempTime: Date.now()
      });
    } else {
      return response.status(500);
    }
  }
}
