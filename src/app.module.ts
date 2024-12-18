import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConcertModule } from './concert/concert.module';
import { PaymentModule } from './payment/payment.module';
import { QueueModule } from './queue/queue.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerModule } from './scheduler/scheduler.module';
import { getDBConfig } from './common/config/database.config';
import { RedisModule } from './common/redis/redis.module';
import { DataInitializerService } from './data-initializer.service';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    UserModule,
    ConcertModule,
    PaymentModule,
    QueueModule,
    SchedulerModule,
    KafkaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDBConfig,
    }),
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService, DataInitializerService],
})
export class AppModule {}
