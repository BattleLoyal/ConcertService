import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PerformanceRepositoryImpl } from './repository/performance.repository.impl';
import { QueueRepositoryImpl } from '../queue/repository/queue.repository.impl';
import { SeatRepositoryImpl } from './repository/seat.repository.impl';
import { EntityManager } from 'typeorm';
import { ReserveSeatDto } from './dto/reserve-seat.dto';
import { ReserveSeatResponseDto } from './dto/reserve-seat-response.dto';

@Injectable()
export class ConcertService {
  constructor(
    private readonly performanceRepository: PerformanceRepositoryImpl,
    private readonly queueRepository: QueueRepositoryImpl,
    private readonly seatRepository: SeatRepositoryImpl,
    private readonly entityManager: EntityManager,
  ) {}

  async getAvailableDates(
    concertId: number,
    startDate: string,
    token: string,
  ): Promise<string[]> {
    // 토큰 상태 확인을 위해 QueueRepository 호출
    const [uuid] = token.split('-QUEUE:');
    const isActive = await this.queueRepository.isTokenActive(uuid);
    if (!isActive) {
      throw new UnauthorizedException('Token is not active.');
    }

    // 예약 가능한 날짜 조회를 위해 PerformanceRepository 호출
    const performances = await this.performanceRepository.getAvailableDates(
      concertId,
      startDate,
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
    token: string,
  ): Promise<number[]> {
    // 토큰 상태 확인을 위해 QueueRepository 호출
    const [uuid] = token.split('-QUEUE:');
    const isActive = await this.queueRepository.isTokenActive(uuid);
    if (!isActive) {
      throw new UnauthorizedException('대기열에 활성화되어있지 않습니다.');
    }

    // 공연 조회
    const performance =
      await this.performanceRepository.getPerformanceByConcertAndDate(
        concertId,
        date,
      );
    if (!performance) {
      throw new NotFoundException('Performance not found for the given date.');
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
    concertId: number,
    reserveSeatDto: ReserveSeatDto,
    token: string,
  ): Promise<ReserveSeatResponseDto> {
    const { userId, date, seatNumber } = reserveSeatDto;

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
          expireTime: expireTime.toLocaleString(),
        };

        return result;
      },
    );
  }
}
