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
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ConcertService } from '../application/service/concert.service';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { AvailableDatesRequestDto } from './dto/request/available-dates-requst.dto';
import { AvailableDatesResponseDto } from './dto/response/available-dates-response.dto';
import { AvailableSeatsRequestDto } from './dto/request/available-seats-request.dto';
import { AvailableSeatsResponseDto } from './dto/response/available-seats-response.dto';
import { ReserveSeatRequestDto } from './dto/request/reserve-seat-request.dto';
import { ReserveSeatResponseDto } from './dto/response/reserve-seat-response.dto';
import { TokenStateGuard } from 'src/common/guards/token-state.guard';

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
    name: 'authorization',
    description: '대기열 토큰',
    required: true,
    example: 'UUID-QUEUE:1',
  })
  @ApiResponse({
    status: 200,
    type: AvailableDatesResponseDto,
  })
  @UseGuards(TokenStateGuard)
  async getAvailableDates(
    @Param('id') concertId: number,
    @Query('date') date: string,
    @Headers('authorization') token: string,
  ): Promise<AvailableDatesResponseDto> {
    const availableDates = await this.concertService.getAvailableDates(
      concertId,
      date,
    );

    return {
      availableDates,
    };
  }

  @Get(':id/seat')
  @ApiOperation({ summary: '예약 가능한 좌석 조회' })
  @ApiParam({ name: 'id', description: '콘서트 ID', example: 1 })
  @ApiQuery({ name: 'date', description: '예약 날짜', example: '2024-10-17' })
  @ApiHeader({
    name: 'authorization',
    description: '대기열 토큰',
    required: true,
    example: 'UUID-QUEUE:1',
  })
  @ApiResponse({
    status: 200,
    description: '좌석 조회 성공',
    type: AvailableSeatsResponseDto,
  })
  @UseGuards(TokenStateGuard)
  async getAvailableSeats(
    @Param('id') concertId: number,
    @Query('date') date: string,
    @Headers('authorization') token: string,
  ): Promise<AvailableSeatsResponseDto> {
    const availableSeats = await this.concertService.getAvailableSeats(
      concertId,
      date,
    );

    return { availableSeats };
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
    name: 'authorization',
    description: '대기열 토큰',
    required: true,
    example: 'UUID-QUEUE:1',
  })
  @ApiBody({ type: ReserveSeatRequestDto })
  @ApiResponse({
    status: 200,
    description: '좌석 임시 예약 성공',
    type: ReserveSeatResponseDto,
  })
  @UseGuards(TokenStateGuard)
  async reserveSeat(
    @Param('id') concertId: number,
    @Body() reserveSeatDto: ReserveSeatRequestDto,
    @Headers('authorization') token: string,
  ): Promise<ReserveSeatResponseDto> {
    reserveSeatDto.concertId = concertId;
    return await this.concertService.reserveSeatWithOptimisticLock(
      reserveSeatDto,
    );
  }
}
