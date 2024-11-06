import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PerformanceRepositoryImpl } from '../../infra/performance.repository.impl';
import { QueueRepositoryImpl } from 'src/queue/infra/queue.repository.impl';
import { SeatRepositoryImpl } from '../../infra/seat.repository.impl';
import {
  EntityManager,
  DataSource,
  OptimisticLockVersionMismatchError,
} from 'typeorm';
import { ReserveSeatResponseDto } from 'src/concert/interface/dto/response/reserve-seat-response.dto';
import { ReserveSeatRequestDto } from 'src/concert/interface/dto/request/reserve-seat-request.dto';
import { RedisService, DEFAULT_REDIS } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { Performance } from '../../domain/entity/performance.entity';

@Injectable()
export class ConcertService {
  private readonly redisClient: Redis | null;

  constructor(
    private readonly performanceRepository: PerformanceRepositoryImpl,
    private readonly queueRepository: QueueRepositoryImpl,
    private readonly seatRepository: SeatRepositoryImpl,
    private readonly dataSource: DataSource,
    private readonly entityManager: EntityManager,
    private readonly redisService: RedisService, // RedisService 주입
  ) {
    this.redisClient = this.redisService.getOrThrow();
  }

  async getAvailableDates(
    concertId: number,
    startDate: string,
  ): Promise<string[]> {
    const hashKey = `performances:${concertId}`;
    const start = new Date(startDate);

    // Redis 해시에서 모든 공연 정보를 조회
    const performances = await this.redisClient.hgetall(hashKey);
    const availableDates: string[] = [];

    // 캐시가 비어 있으면 DB에서 공연 정보를 조회하고 캐시에 저장
    if (Object.keys(performances).length === 0) {
      // DB에서 모든 공연 정보 조회
      const dbPerformances = await this.performanceRepository.getAvailableDates(
        concertId,
        start,
      );

      // DB에서 가져온 공연 정보를 Redis 해시에 저장
      for (const performance of dbPerformances) {
        await this.redisClient.hset(
          hashKey,
          performance.date.toString(),
          JSON.stringify(performance),
        );
        performances[performance.date.toString()] = JSON.stringify(performance); // 로컬 변수 업데이트
      }

      // DB에서 모든 공연 정보 조회했다는 로그
      console.log('getAvailableDates::DB에서 모든 공연 정보 조회');
    } else {
      // 캐시에 공연 정보가 있을 경우 로그
      console.log('getAvailableDates::캐시에서 모든 공연 정보 조회');
    }

    // startDate 이후의 날짜만 필터링하여 반환 목록에 추가
    for (const [date, performanceData] of Object.entries(performances)) {
      const performanceDate = new Date(date);

      if (performanceDate >= start) {
        availableDates.push(date);
      }
    }

    return availableDates;
  }

  async getAvailableSeats(concertId: number, date: string): Promise<number[]> {
    const seatCacheKey = `available_seats:${concertId}:${date}`;

    // Redis에서 예약 가능한 좌석 목록 조회
    const cachedSeats = await this.redisClient.get(seatCacheKey);

    if (cachedSeats) {
      console.log('getAvailableSeats::캐시에서 좌석 목록 조회');
      return JSON.parse(cachedSeats);
    }

    // 공연 정보 확인 후 performanceId 가져오기
    const performance = await this.getPerformanceWithCache(concertId, date);
    const performanceId = performance.performanceid;

    // 공연 ID를 사용하여 DB에서 예약 가능한 좌석 목록 조회
    const availableSeats =
      await this.seatRepository.getAvailableSeatsByPerformance(performanceId);
    console.log('getAvailableSeats::DB에서 좌석 정보 조회');

    // 좌석 번호만 추출하여 배열로 변환
    const seatNumbers = availableSeats.map((seat) => seat.seatnumber);

    // Redis에 좌석 정보를 저장 (TTL을 설정해 만료 시간을 추가)
    await this.redisClient.set(
      seatCacheKey,
      JSON.stringify(seatNumbers),
      'EX',
      300,
    ); // 5분 TTL

    return seatNumbers;
  }

  // 좌석 예약
  async reserveSeat(
    reserveSeatDto: ReserveSeatRequestDto,
    token: string,
  ): Promise<ReserveSeatResponseDto> {
    const { concertId, userId, date, seatNumber } = reserveSeatDto;

    return await this.entityManager.transaction(
      async (manager: EntityManager) => {
        // 토큰 상태 확인
        const [uuid] = token.split('-QUEUE:');
        const isActive = await this.queueRepository.isTokenActive(uuid);
        if (!isActive) {
          throw new UnauthorizedException('대기열에 활성화되지 않았습니다.');
        }

        // 콘서트 ID와 날짜로 공연 아이디 가져오기
        const performance =
          await this.performanceRepository.getPerformanceByConcertAndDate(
            concertId,
            date,
          );
        if (!performance) {
          throw new NotFoundException('해당 날짜의 공연을 찾을 수 없습니다.');
        }

        // 5분 동안 임시 예약 - 트랜잭션 내부에서 처리
        const expireTime = new Date();
        expireTime.setMinutes(expireTime.getMinutes() + 5);
        await this.seatRepository.reserveSeat(
          seatNumber,
          userId,
          expireTime,
          manager,
        );

        const result: ReserveSeatResponseDto = {
          userId,
          date,
          seatNumber,
          concertId,
          expire: expireTime.toLocaleString(),
        };

        return result;
      },
    );
  }

  // 좌석 예약 - 낙관적 락
  async reserveSeatWithOptimisticLock(
    reserveSeatDto: ReserveSeatRequestDto,
  ): Promise<ReserveSeatResponseDto> {
    const { concertId, userId, date, seatNumber } = reserveSeatDto;
    const performanceCacheKey = `performances:${concertId}:${date}`;

    // 공연 ID를 캐시에서 가져오거나 DB에서 조회
    let performanceId: number;
    const cachedPerformance = await this.redisClient.get(performanceCacheKey);

    if (cachedPerformance) {
      console.log('reserveSeatWithOptimisticLock::캐시에서 공연 정보 조회');
      performanceId = JSON.parse(cachedPerformance).performanceid;
    } else {
      const performance =
        await this.performanceRepository.getPerformanceByConcertAndDate(
          concertId,
          date,
        );

      if (!performance) {
        throw new NotFoundException('해당 날짜의 공연을 찾을 수 없습니다.');
      }

      console.log('reserveSeatWithOptimisticLock::DB에서 공연 정보 조회');
      performanceId = performance.performanceid;

      // 공연 정보를 캐시에 저장
      await this.redisClient.set(
        performanceCacheKey,
        JSON.stringify(performance),
        'EX',
        300,
      );
    }

    // 특정 좌석 상태를 캐시 또는 DB에서 조회
    const seatStatus = await this.getSeatStatusFromCacheOrDb(
      concertId,
      date,
      seatNumber,
      performanceId,
    );

    // 예약 가능한 상태인지 확인
    if (seatStatus !== 'RESERVABLE') {
      throw new ConflictException('해당 좌석은 예약할 수 없습니다.');
    }

    // 좌석을 TEMP 상태로 임시 예약 설정 (5분 후 만료)
    const expireTime = new Date();
    expireTime.setMinutes(expireTime.getMinutes() + 5);

    try {
      // 낙관적 락을 적용하여 DB에서 좌석 상태 업데이트
      const seat = await this.seatRepository.findOneByPerformanceAndSeatNumber(
        performanceId,
        seatNumber,
      );
      seat.status = 'TEMP';
      seat.userId = userId;
      seat.expire = expireTime;

      await this.seatRepository.reserveSeatWithOptimisticLock(seat);

      // 예약이 성공적으로 완료되면 캐시에서 해당 좌석 삭제 (필요 시 TEMP로 캐시 업데이트)
      const seatCacheKey = `seat_status:${concertId}:${date}:${seatNumber}`;
      await this.redisClient.del(seatCacheKey);

      return {
        userId,
        date,
        seatNumber,
        concertId,
        expire: expireTime.toLocaleString(),
      };
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException(
          '다른 사용자에 의해 좌석 상태가 변경되었습니다.',
        );
      }
      throw error;
    }
  }

  // 좌석 예약 - 비관적 락
  async reserveSeatWithPessimisticLock(
    reserveSeatDto: ReserveSeatRequestDto,
    token: string,
  ): Promise<ReserveSeatResponseDto> {
    const { concertId, userId, date, seatNumber } = reserveSeatDto;

    // 토큰 상태 확인
    const [uuid] = token.split('-QUEUE:');
    const isActive = await this.queueRepository.isTokenActive(uuid);
    if (!isActive) {
      throw new UnauthorizedException('대기열에 활성화되지 않았습니다.');
    }

    // 콘서트 ID와 날짜로 공연 아이디 가져오기
    const performance =
      await this.performanceRepository.getPerformanceByConcertAndDate(
        concertId,
        date,
      );
    if (!performance) {
      throw new NotFoundException('해당 날짜의 공연을 찾을 수 없습니다.');
    }

    // 비관적 락으로 잠금
    return await this.entityManager.transaction(async (manager) => {
      const seat =
        await this.seatRepository.findOneByPerformanceAndSeatNumberWithLock(
          performance.performanceid,
          seatNumber,
          manager,
        );
      if (!seat || seat.status !== 'RESERVABLE') {
        throw new ConflictException('해당 좌석은 예약할 수 없습니다.');
      }

      // 5분 동안 임시 예약 설정
      const expireTime = new Date();
      expireTime.setMinutes(expireTime.getMinutes() + 5);

      // 좌석 정보 업데이트
      seat.status = 'TEMP';
      seat.userId = userId;
      seat.expire = expireTime;

      // 좌석 정보 저장
      await manager.save(seat);

      const result: ReserveSeatResponseDto = {
        userId,
        date,
        seatNumber,
        concertId,
        expire: expireTime.toLocaleString(),
      };

      return result;
    });
  }

  // 캐시에서 공연을 조회한다.
  async getPerformanceWithCache(
    concertId: number,
    date: string,
  ): Promise<Performance> {
    const hashKey = `performances:${concertId}`;

    // Redis 해시에서 공연 정보 조회
    const performanceData = await this.redisClient.hget(hashKey, date);
    let performance: Performance;

    if (performanceData) {
      // 캐시에서 JSON 형태의 공연 데이터를 파싱하여 반환
      performance = JSON.parse(performanceData) as Performance;
    } else {
      // 캐시에 데이터가 없을 경우 DB에서 조회
      performance =
        await this.performanceRepository.getPerformanceByConcertAndDate(
          concertId,
          date,
        );

      if (!performance) {
        throw new NotFoundException('해당 날짜의 공연을 찾을 수 없습니다.');
      }

      // 공연 정보를 JSON 형태로 변환하여 Redis 해시에 저장
      await this.redisClient.hset(hashKey, date, JSON.stringify(performance));
    }

    return performance;
  }

  async getSeatStatusFromCacheOrDb(
    concertId: number,
    date: string,
    seatNumber: number,
    performanceId: number,
  ): Promise<string> {
    const seatCacheKey = `seat_status:${concertId}:${date}:${seatNumber}`;

    // Redis에서 좌석 상태 조회
    const cachedStatus = await this.redisClient.get(seatCacheKey);

    if (cachedStatus) {
      return cachedStatus;
    }

    // 캐시에 없을 경우 DB에서 해당 좌석의 상태 조회
    const seat = await this.seatRepository.findOneByPerformanceAndSeatNumber(
      performanceId,
      seatNumber,
    );

    if (!seat) {
      throw new NotFoundException('해당 좌석을 찾을 수 없습니다.');
    }

    // 좌석 상태가 RESERVABLE일 때만 캐시에 저장
    if (seat.status === 'RESERVABLE') {
      await this.redisClient.set(seatCacheKey, seat.status, 'EX', 300); // 5분 TTL
    }

    return seat.status;
  }
}
