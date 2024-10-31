import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ConcertService } from 'src/concert/application/service/concert.service';
import {
  getRepositoryToken,
  getDataSourceToken,
  TypeOrmModule,
} from '@nestjs/typeorm';
import { Seat } from 'src/concert/domain/entity/seat.entity';
import { Performance } from 'src/concert/domain/entity/performance.entity';
import { Queue } from 'src/queue/domain/entity/queue.entity';
import { Concert } from 'src/concert/domain/entity/concert.entity';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { PerformanceRepositoryImpl } from 'src/concert/infra/performance.repository.impl';
import { QueueRepositoryImpl } from 'src/queue/infra/queue.repository.impl';
import { SeatRepositoryImpl } from 'src/concert/infra/seat.repository.impl';

describe('콘서트 통합 테스트', () => {
  let service: ConcertService;
  let queueRepository: QueueRepositoryImpl;
  let seatRepository: SeatRepositoryImpl;
  let performanceRepository: PerformanceRepositoryImpl;
  let dataSource: DataSource;

  beforeAll(async () => {
    // 테스트 모듈 초기화 및 데이터베이스 연결 설정
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT, 10),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          entities: [Seat, Performance, Queue, Concert],
          synchronize: true,
          timezone: '+09:00',
          extra: {
            connectionLimit: 20,
          },
          //logging: true,
        }),
        TypeOrmModule.forFeature([Seat, Performance, Queue, Concert]),
      ],
      providers: [
        ConcertService,
        PerformanceRepositoryImpl,
        QueueRepositoryImpl,
        SeatRepositoryImpl,
      ],
    }).compile();

    service = module.get<ConcertService>(ConcertService);
    queueRepository = module.get<QueueRepositoryImpl>(QueueRepositoryImpl);
    seatRepository = module.get<SeatRepositoryImpl>(SeatRepositoryImpl);
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
    await dataSource.destroy(); // 데이터베이스 연결 종료
  });

  // 테스트 케이스
  // 1. 낙관적 락 - 좌석 예약 성공 케이스 =============================================
  it(
    '낙관적 락 : 동시 좌석 예약 시도 중 단 하나만 성공',
    async () => {
      // give
      const performanceDate = '2024-11-10';
      const date = new Date(performanceDate);
      const concertId = 1;
      const seatNumber = 1;
      const performanceid = 1;

      const tryCount = 100; // 동시 요청 개수

      // 공연 및 좌석 설정
      const performance = await performanceRepository.savePerformance({
        performanceid: performanceid,
        concertid: concertId,
        date: date,
      });

      // 좌석 생성
      await seatRepository.saveSeat({
        performanceId: performance.performanceid,
        seatnumber: seatNumber,
        price: 100,
        status: 'RESERVABLE',
      });

      // 대기열에 저장
      for (let i = 1; i <= tryCount; i++) {
        await queueRepository.saveQueue({
          UUID: `UUID${i}`,
          UserID: i,
          status: 'ACTIVE',
        });
      }

      const reserveSeatDto = { concertId, date: performanceDate, seatNumber };
      const tokens = Array.from(
        { length: tryCount },
        (_, i) => `UUID${i + 1}-QUEUE:ACTIVE`,
      );

      // 동시에 좌석 예약 요청
      const promises = tokens.map((token, index) =>
        service
          .reserveSeatWithOptimisticLock(
            { ...reserveSeatDto, userId: index + 1 },
            token,
          )
          .then(() => 'success')
          .catch((error) => {
            console.log(`User ${index + 1} failed:`, error.message);
            return 'failure';
          }),
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(
        (result) => result === 'success',
      ).length;
      const failureCount = results.filter(
        (result) => result === 'failure',
      ).length;

      // 단 하나의 요청만 성공해야 함을 검증
      expect(successCount).toBe(1);
      expect(failureCount).toBe(tryCount - 1);
    },
    50 * 1000,
  );
  // =============================================

  // 2. 비관적 락 - 좌석 예약 성공 케이스 =============================================
  it(
    '비관적락 : 동시 좌석 예약 중 한 명만 성공',
    async () => {
      // give
      const performanceDate = '2024-11-10';
      const date = new Date(performanceDate);
      const concertId = 1;
      const seatNumber = 1;
      const performanceid = 1;

      const tryCount = 100; // 동시 요청 개수

      // 공연 및 좌석 설정
      const performance = await performanceRepository.savePerformance({
        performanceid: performanceid,
        concertid: concertId,
        date: date,
      });

      // 좌석 생성
      await seatRepository.saveSeat({
        performanceId: performance.performanceid,
        seatnumber: seatNumber,
        price: 100,
        status: 'RESERVABLE',
      });

      // 대기열에 저장
      for (let i = 1; i <= tryCount; i++) {
        await queueRepository.saveQueue({
          UUID: `UUID${i}`,
          UserID: i,
          status: 'ACTIVE',
        });
      }

      const reserveSeatDto = { concertId, date: performanceDate, seatNumber };
      const tokens = Array.from(
        { length: tryCount },
        (_, i) => `UUID${i + 1}-QUEUE:ACTIVE`,
      );

      // 동시에 좌석 예약 요청
      const promises = tokens.map((token, index) =>
        service
          .reserveSeatWithPessimisticLock(
            { ...reserveSeatDto, userId: index + 1 },
            token,
          )
          .then(() => 'success')
          .catch((error) => {
            console.log(`User ${index + 1} failed:`, error.message);
            return 'failure';
          }),
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(
        (result) => result === 'success',
      ).length;
      const failureCount = results.filter(
        (result) => result === 'failure',
      ).length;

      // 단 하나의 요청만 성공해야 함을 검증
      expect(successCount).toBe(1);
      expect(failureCount).toBe(tryCount - 1);
    },
    50 * 1000,
  );
});
