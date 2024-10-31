import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/application/user.service';
import { UserRepositoryImpl } from 'src/user/infra/user.repository.impl';
import { DataSource } from 'typeorm';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { User } from 'src/user/domain/entity/user.entity';
import { Seat } from 'src/concert/domain/entity/seat.entity';
import { Performance } from 'src/concert/domain/entity/performance.entity';
import { Queue } from 'src/queue/domain/entity/queue.entity';
import { Concert } from 'src/concert/domain/entity/concert.entity';
import { Reservation } from 'src/concert/domain/entity/reservation.entity';
import { getDBConfig } from 'src/common/config/database.config';
import { PaymentService } from 'src/payment/application/service/payment.service';
import { PaymentRepositoryImpl } from 'src/payment/infra/payment.repository.impl';
import { SeatRepositoryImpl } from 'src/concert/infra/seat.repository.impl';
import { CreatePaymentDto } from 'src/payment/interface/dto/create-payment.dto';
import { QueueRepositoryImpl } from 'src/queue/infra/queue.repository.impl';
import { ReservationRepositoryImpl } from 'src/concert/infra/reservation.repository.impl';
import { PerformanceRepositoryImpl } from 'src/concert/infra/performance.repository.impl';
import { Payment } from 'src/payment/domain/entity/payment.entity';

describe('유저 결제 통합테스트', () => {
  let payService: PaymentService;
  let payRepository: PaymentRepositoryImpl;
  let userRepository: UserRepositoryImpl;
  let seatRepository: SeatRepositoryImpl;
  let queueRepository: QueueRepositoryImpl;
  let reserveRepository: ReservationRepositoryImpl;
  let performanceRepository: PerformanceRepositoryImpl;
  let dataSource: DataSource;

  beforeAll(async () => {
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
          User,
          Reservation,
          Payment,
        ]),
      ],
      providers: [
        PaymentService,
        PaymentRepositoryImpl,
        SeatRepositoryImpl,
        UserRepositoryImpl,
        QueueRepositoryImpl,
        PerformanceRepositoryImpl,
        ReservationRepositoryImpl,
      ],
    }).compile();

    payService = module.get<PaymentService>(PaymentService);
    payRepository = module.get<PaymentRepositoryImpl>(PaymentRepositoryImpl);
    userRepository = module.get<UserRepositoryImpl>(UserRepositoryImpl);
    seatRepository = module.get<SeatRepositoryImpl>(SeatRepositoryImpl);
    queueRepository = module.get<QueueRepositoryImpl>(QueueRepositoryImpl);
    reserveRepository = module.get<ReservationRepositoryImpl>(
      ReservationRepositoryImpl,
    );
    performanceRepository = module.get<PerformanceRepositoryImpl>(
      PerformanceRepositoryImpl,
    );
    dataSource = module.get<DataSource>(getDataSourceToken());
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터베이스 초기화
    const entities = dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      console.log(`${entity.tableName} truncated`);
      await repository.query(`TRUNCATE TABLE ${entity.tableName}`);
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  // 1. 낙관적 락 - 좌석 결제 테스트 =============================================
  it(
    '낙관적 락 : 한 유저가 임시예약했던 좌석 결제를 동시에 여러번 호출하는 경우',
    async () => {
      // Given
      const initBalance = 1000;
      const seatPrice = 500;
      const performanceId = 1;

      // 사용자 생성
      const user = await userRepository.save({ balance: initBalance });

      // 공연 정보 생성
      const performance = await performanceRepository.savePerformance({
        concertid: 1,
        date: new Date('2024-11-01'),
      });

      const expireTime = new Date();
      expireTime.setMinutes(expireTime.getMinutes() + 5);

      // 임시 예약된 좌석 생성
      const seat = await seatRepository.save({
        seatnumber: 1,
        performanceId: performanceId,
        userId: user.userId,
        status: 'TEMP',
        price: seatPrice,
        expire: expireTime,
      });

      // 대기열 토큰 생성 및 활성화
      const token = `UUID-QUEUE:ACTIVE`;
      await queueRepository.saveQueue({
        UUID: 'UUID',
        UserID: user.userId,
        status: 'ACTIVE',
      });

      // 결제 요청
      const paymentDto: CreatePaymentDto = {
        userId: user.userId,
        concertId: 1,
        date: '2024-11-01',
        seatNumber: seat.seatnumber,
      };

      // When
      // 동시에 결제 요청을 보냄
      const requests = Array.from({ length: 1 }, () =>
        payService
          .processPaymentWithOptimisticLock(token, paymentDto)
          .then(() => 'success')
          .catch((error) => {
            return 'failure';
          }),
      );

      // 모든 요청 실행 후 결과 확인
      const results = await Promise.all(requests);
      const successCount = results.filter(
        (result) => result === 'success',
      ).length;
      const failureCount = results.filter(
        (result) => result === 'failure',
      ).length;

      // Then
      // 단 하나의 결제만 성공해야 함을 검증
      expect(successCount).toBe(1);
      expect(failureCount).toBe(0);
    },
    50 * 1000,
  );
});
