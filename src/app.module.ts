import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConcertModule } from './concert/concert.module';
import { PaymentModule } from './payment/payment.module';
import { TokenModule } from './token/token.module';

@Module({
  imports: [UserModule, ConcertModule, PaymentModule, TokenModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
