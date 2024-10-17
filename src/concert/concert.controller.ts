import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  Body,
  Headers,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { AvailableDatesDto } from './dto/available-dates.dto';
import { ConcertService } from './concert.service'; // ConcertService 임포트
import { AvailableSeatsDto } from './dto/available-seats.dto';
import { ReserveSeatDto } from './dto/reserve-seat.dto';

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
  async getAvailableSeats(
    @Param('id') concertId: number,
    @Query('date') date: string,
    @Headers('X-Token') token: string,
    @Res() response: Response,
  ): Promise<any> {
    const availableSeats = await this.concertService.getAvailableSeats(
      concertId,
      date,
      token,
    );

    const responseBody: AvailableSeatsDto = {
      concertId,
      availableSeats,
    };

    // 응답 반환
    return response.status(200).json(responseBody);
  }

  @Post(':id/reserve-seat')
  @HttpCode(200)
  async reserveSeat(
    @Param('id') concertId: number,
    @Body() reserveSeatDto: ReserveSeatDto,
    @Headers('X-Token') token: string,
  ): Promise<any> {
    return await this.concertService.reserveSeat(
      concertId,
      reserveSeatDto,
      token,
    );
  }
}
