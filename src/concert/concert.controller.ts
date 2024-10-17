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
import { ConcertService } from './concert.service';
import { AvailableSeatsDto } from './dto/available-seats.dto';
import { ReserveSeatDto } from './dto/reserve-seat.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { ReserveSeatResponseDto } from './dto/reserve-seat-response.dto';

@ApiTags('Concert')
@Controller('concert')
export class ConcertController {
  constructor(private readonly concertService: ConcertService) {}

  @Get(':id/date')
  @ApiOperation({
    summary: '예약 가능 날짜 조회',
    description: '특정 콘서트의 예약 가능 날짜를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '콘서트 ID', example: 1 })
  @ApiQuery({
    name: 'date',
    description: '검색 기준 날짜',
    required: true,
    example: '2024-10-17',
  })
  @ApiHeader({
    name: 'X-Token',
    description: '대기열 토큰',
    required: true,
    example: 'UUID-QUEUE:1',
  })
  @ApiResponse({
    status: 200,
    type: AvailableDatesDto,
  })
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
  @ApiOperation({ summary: '예약 가능한 좌석 조회' })
  @ApiParam({ name: 'id', description: '콘서트 ID', example: 1 })
  @ApiQuery({ name: 'date', description: '예약 날짜', example: '2024-10-17' })
  @ApiHeader({
    name: 'X-Token',
    description: '대기열 토큰',
    required: true,
    example: 'UUID-QUEUE:1',
  })
  @ApiResponse({
    status: 200,
    description: '좌석 조회 성공',
    type: AvailableSeatsDto,
  })
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
  @ApiOperation({
    summary: '좌석 임시 예약',
    description: '좌석을 5분간 임시로 예약합니다.',
  })
  @ApiParam({ name: 'id', description: '콘서트 ID', example: 1 })
  @ApiQuery({ name: 'date', description: '예약할 날짜', example: '2024-10-17' })
  @ApiHeader({
    name: 'X-Token',
    description: '대기열 토큰',
    required: true,
    example: 'UUID-QUEUE:1',
  })
  @ApiBody({ type: ReserveSeatDto })
  @ApiResponse({
    status: 200,
    description: '좌석 임시 예약 성공',
    type: ReserveSeatResponseDto,
  })
  async reserveSeat(
    @Param('id') concertId: number,
    @Body() reserveSeatDto: ReserveSeatDto,
    @Headers('X-Token') token: string,
  ): Promise<ReserveSeatResponseDto> {
    return await this.concertService.reserveSeat(
      concertId,
      reserveSeatDto,
      token,
    );
  }
}
