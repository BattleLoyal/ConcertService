import { Controller, Post, Headers, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async processPayment(
    @Headers('X-Token') token: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<any> {
    return await this.paymentService.processPayment(token, createPaymentDto);
  }
}
