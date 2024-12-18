import { Controller, Post, Headers, Body, UseGuards } from '@nestjs/common';
import { PaymentService } from '../application/service/payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { TokenStateGuard } from 'src/common/guards/token-state.guard';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({
    summary: '좌석 결제',
    description: '예약된 좌석의 결제를 처리합니다.',
  })
  @ApiHeader({
    name: 'authorization',
    description: '대기열 토큰',
    required: true,
    example: 'UUID-QUEUE:1',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: 200,
    description: '결제 성공',
    schema: {
      example: {
        status: 'Success',
        tokenState: 'Expired',
        userId: 1,
        performanceId: 1,
        seatNumber: 25,
        amount: 10000,
        balance: 1000,
      },
    },
  })
  @ApiResponse({
    status: 402,
    description: '결제 실패',
    schema: {
      example: {
        status: 'Fail',
        userId: 1,
        performanceId: 1,
        seatNumber: 25,
        amount: 10000,
        balance: 1000,
      },
    },
  })
  @UseGuards(TokenStateGuard)
  async processPayment(
    @Headers('authorization') token: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<any> {
    return await this.paymentService.processPayment(token, createPaymentDto);
  }
}
