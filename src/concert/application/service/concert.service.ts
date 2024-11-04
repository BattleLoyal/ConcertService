import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
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

@Injectable()
export class ConcertService {
  constructor(
    private readonly performanceRepository: PerformanceRepositoryImpl,
    private readonly queueRepository: QueueRepositoryImpl,
    private readonly seatRepository: SeatRepositoryImpl,
    private readonly dataSource: DataSource,
    private readonly entityManager: EntityManager,
  ) {}

  async getAvailableDates(
    concertId: number,
    startDate: string,
  ): Promise<string[]> {
    const parsedDate = new Date(startDate);

    // 예약 가능한 날짜 조회를 위해 PerformanceRepository 호출
    const performances = await this.performanceRepository.getAvailableDates(
      concertId,
      parsedDate,
    );

    if (!performances.length) {
      throw new NotFoundException('No available dates found for this concert.');
    }

    return performances.map(
      (performance) => new Date(performance.date).toISOString().split('T')[0],
    );
  }

  async getAvailableSeats(
    concertId: number,
    date: string,
  ): Promise<number[]> {
    // 공연 조회
    const performance =
      await this.performanceRepository.getPerformanceByConcertAndDate(
        concertId,
        date,
      );
    if (!performance) {
      throw new NotFoundException('해당 날짜의 공연을 찾을 수 없습니다.');
    }

    // 해당 공연에 예약 가능한 좌석 조회
    const availableSeats =
      await this.seatRepository.getAvailableSeatsByPerformance(
        performance.performanceid,
      );

    // 예약 가능한 좌석 번호 배열 반환
    return availableSeats.map((seat) => seat.seatnumber);
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

    // 콘서트 ID와 날짜로 공연 아이디 가져오기
    const performance =
      await this.performanceRepository.getPerformanceByConcertAndDate(
        concertId,
        date,
      );
    if (!performance) {
      throw new NotFoundException('해당 날짜의 공연을 찾을 수 없습니다.');
    }

    // 좌석 조회 - 예약 가능 상태 확인
    const seat = await this.seatRepository.findOneByPerformanceAndSeatNumber(
      performance.performanceid,
      seatNumber,
    );
    if (!seat || seat.status !== 'RESERVABLE') {
      throw new ConflictException('해당 좌석은 예약할 수 없습니다.');
    }

    // 5분 동안 임시 예약 설정
    const expireTime = new Date();
    expireTime.setMinutes(expireTime.getMinutes() + 5);

    // 좌석 정보 업데이트
    seat.status = 'TEMP'; // 임시 예약
    seat.userId = userId;
    seat.expire = expireTime;

    // 낙관적 락을 적용하여 상태 업데이트
    await this.seatRepository.reserveSeatWithOptimisticLock(seat);

    const result: ReserveSeatResponseDto = {
      userId,
      date,
      seatNumber,
      concertId,
      expire: expireTime.toLocaleString(),
    };

    return result;
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
}
