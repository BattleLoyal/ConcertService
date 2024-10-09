import { Controller, Get, Param, Query, Res } from '@nestjs/common';
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
        date: availableDates,
      });
    } else {
      return response.status(500);
    }
  }
}
