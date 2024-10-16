import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PerformanceRepositoryImpl } from './repository/performance.repository.impl';
import { QueueRepositoryImpl } from '../queue/repository/queue.repository.impl';

@Injectable()
export class ConcertService {
  constructor(
    private readonly performanceRepository: PerformanceRepositoryImpl,
    private readonly queueRepository: QueueRepositoryImpl, // QueueRepository 주입
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
}
