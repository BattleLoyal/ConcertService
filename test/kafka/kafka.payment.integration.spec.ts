import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentService } from 'src/payment/application/service/payment.service';
import { KafkaProducer } from 'src/kafka/kafka-producer';
import { KafkaConsumer } from 'src/kafka/kafka-consumer';
import { DataInitializerService } from 'src/data-initializer.service';
import { PaymentModule } from 'src/payment/payment.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDBConfig } from 'src/common/config/database.config';
import { Seat } from 'src/concert/domain/entity/seat.entity';
import { Performance } from 'src/concert/domain/entity/performance.entity';
import { Queue } from 'src/queue/domain/entity/queue.entity';
import { Concert } from 'src/concert/domain/entity/concert.entity';
import { User } from 'src/user/domain/entity/user.entity';
import { Payment } from 'src/payment/domain/entity/payment.entity';
import { Reservation } from 'src/concert/domain/entity/reservation.entity';
import { ConcertService } from 'src/concert/application/service/concert.service';
import { RedisModule } from 'src/common/redis/redis.module';
import { ConcertModule } from 'src/concert/concert.module';

describe('카프카 결제 통합 테스트', () => {
  let paymentService: PaymentService;
  let kafkaConsumer: KafkaConsumer;
  let dataInitializerService: DataInitializerService;
  let concertService: ConcertService;

  jest.setTimeout(30000);

  beforeAll(async () => {
    // 테스트 모듈 생성
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: getDBConfig,
        }),
        TypeOrmModule.forFeature([
          Seat,
          Performance,
          Queue,
          Concert,
          Payment,
          Reservation,
          User,
        ]),
        PaymentModule,
        KafkaModule,
        RedisModule,
        ConcertModule,
      ],
      providers: [
        DataInitializerService,
        {
          provide: KafkaProducer,
          useValue: new KafkaProducer(),
        },
        {
          provide: KafkaConsumer,
          useValue: new KafkaConsumer(),
        },
      ],
    }).compile();

    paymentService = module.get<PaymentService>(PaymentService);
    concertService = module.get<ConcertService>(ConcertService);
    kafkaConsumer = module.get<KafkaConsumer>(KafkaConsumer);
    dataInitializerService = module.get<DataInitializerService>(
      DataInitializerService,
    );

    // 테스트 데이터 입력
    await dataInitializerService.onModuleInit();
  });

  afterAll(async () => {
    await kafkaConsumer.onModuleDestroy();
  });

  it('카프카 Producer, Consumer 테스트', async () => {
    const userId = 1;
    const paymentId = 1;
    const seatid = 1;
    const seatNumber = 1;
    const concertId = 1;
    const date = '2024-11-22';

    // 카프카로 전송할 정보
    const orderInfo = {
      userId: userId,
      seat: seatid,
      paymentId: paymentId,
    };

    // 좌석 조회
    await concertService.getAvailableSeatsWithCache(concertId, date);
    // 좌석 임시 예약
    await concertService.reserveSeatWithOptimisticLockWithCache({
      concertId,
      userId,
      date,
      seatNumber,
    });
    // 좌석 결제처리
    // 여기서 kafka Producer로 메시지 전송
    await paymentService.processPayment('UUIDTEST1', {
      userId,
      concertId,
      date,
      seatNumber,
    });

    let consumedMessage: any = null;
    let receiveOrderInfo = null;

    // 여기서 kafka Consumer로 메시지 수신
    await new Promise<void>((resolve) => {
      kafkaConsumer.consumeOneTime(({ message }) => {
        consumedMessage = JSON.parse(message.value.toString());
        receiveOrderInfo = JSON.parse(consumedMessage.value);
        resolve();
      });
    });

    expect(receiveOrderInfo).toEqual(orderInfo);

    kafkaConsumer.onModuleDestroy();
  });
});
