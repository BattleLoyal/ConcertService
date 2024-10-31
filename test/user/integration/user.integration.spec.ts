import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/application/user.service';
import { UserRepositoryImpl } from 'src/user/infra/user.repository.impl';
import { DataSource } from 'typeorm';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { User } from 'src/user/domain/entity/user.entity';
import { ConflictException } from '@nestjs/common';
import { getDBConfig } from 'src/common/config/database.config';

describe('유저 포인트 충전 테스트', () => {
  let userService: UserService;
  let userRepository: UserRepositoryImpl;
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
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UserService, UserRepositoryImpl],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepositoryImpl>(UserRepositoryImpl);
    dataSource = module.get<DataSource>(getDataSourceToken());
  });

  beforeEach(async () => {
    await userRepository.clear();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  // 테스트 케이스
  // 1. 낙관적 락 - 포인트 충전 케이스 =============================================
  // 성공 케이스가 되지 못함 -> 유저 조회시, 유저 아이디로 조회하므로
  // 100건을 동시에 요청하더라도 충전이 먼저 된 건수가 version을 변경하게 되고
  // 아직 조회를 하지 못한 건수들이 이후 조회시 version 값이 달라진다.
  // 따라서 100건 중 몇건이 성공할지 확신할 수 없으며 매번 달라진다.
  it(
    '낙관적 락 : 한 유저가 동시에 포인트 충전을 다수 요청하는 케이스',
    async () => {
      //given
      const initAmount = 1000;
      const chargeAmount = 500;
      const tryCount = 10;
      // 유저 저장
      const user = await userRepository.save({
        balance: initAmount,
      });

      // when
      // 동시에 포인트 충전 요청
      const requests = Array.from({ length: tryCount }, () =>
        userService
          .chargeBalanceWithOptimisticLock(user.userId, chargeAmount)
          .then(() => 'success')
          .catch((error) => {
            return 'failure';
          }),
      );

      // 모든 요청 실행 저장
      const results = await Promise.all(requests);
      const successCount = results.filter(
        (result) => result === 'success',
      ).length;
      const failureCount = results.filter(
        (result) => result === 'failure',
      ).length;

      // Then
      // 단 하나의 충전만 성공해야 한다? -> 실패.
      // expect(successCount).toBe(1);
      // expect(failureCount).toBe(tryCount - 1);

      // 유저의 잔액은 성공카운트*충전금액을 더한 금액이 된다.
      const updatedUser = await userRepository.findOneBy({
        userId: user.userId,
      });
      expect(updatedUser.balance).toBe(
        initAmount + successCount * chargeAmount,
      );
    },
    50 * 1000,
  );
  // ====================================================

  // 2. 비관적 락 - 포인트 충전 케이스 =============================================
  it(
    '비관적 락 : 한 유저가 동시에 포인트 충전을 다수 요청하는 케이스',
    async () => {
      //given
      const initAmount = 1000;
      const chargeAmount = 500;
      const tryCount = 10;
      // 유저 저장
      const user = await userRepository.save({
        balance: initAmount,
      });

      // when
      // 동시에 포인트 충전 요청
      const requests = Array.from({ length: tryCount }, () =>
        userService
          .chargeBalanceWithPessimisticLock(user.userId, chargeAmount)
          .then(() => 'success')
          .catch((error) => {
            return 'failure';
          }),
      );

      // 모든 요청 실행 저장
      const results = await Promise.all(requests);
      const successCount = results.filter(
        (result) => result === 'success',
      ).length;
      const failureCount = results.filter(
        (result) => result === 'failure',
      ).length;

      // Then
      // 모든 포인트 충전을 성공해야 한다.
      expect(successCount).toBe(tryCount);
      expect(failureCount).toBe(0);

      // 유저의 잔액은 성공케이스*충전금액
      const updatedUser = await userRepository.findOneBy({
        userId: user.userId,
      });
      expect(updatedUser.balance).toBe(initAmount + chargeAmount * tryCount);
    },
    50 * 1000,
  );
});
