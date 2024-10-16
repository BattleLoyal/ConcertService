import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  Body,
  Headers,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AvailableDatesDto } from './dto/available-dates.dto';
import { ConcertService } from './concert.service'; // ConcertService 임포트
@Controller('concert')
export class ConcertController {
  constructor(private readonly concertService: ConcertService) {}

  @Get(':id/date')
  async getAvailableDates(
    @Param('id') concertId: number,
    @Query('date') date: string,
    @Headers('X-Token') token: string,
    @Res() response: Response,
  ): Promise<any> {
    // 서비스 호출
    const availableDates = await this.concertService.getAvailableDates(
      concertId,
      date,
      token,
    );

    const responseBody: AvailableDatesDto = {
      availableDates,
    };

    return response.status(200).json(responseBody);
  }

  @Get(':id/seat')
  getAvailableSeats(
    @Param('id') concertId: string,
    @Query('date') date: string,
    @Res() response: Response,
  ): any {
    if (concertId && date) {
      const availableSeats = [1, 4, 15, 21, 45];

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
        tempTime: Date.now(),
      });
    } else {
      return response.status(500);
    }
  }
}
