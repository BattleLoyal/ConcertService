import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueSchedulerRepository } from './queuescheduler.repository';
import { Queue } from '../queue/domain/entity/queue.entity';
import { Seat } from '../concert/domain/entity/seat.entity';
import { SeatSchedulerRepository } from './seatscheduler.repository';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly queueSchedulerRepository: QueueSchedulerRepository;
  private readonly seatSchedulerRepository: SeatSchedulerRepository;

  constructor(
    @InjectRepository(Queue)
    private readonly queueRepository: Repository<Queue>,
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {
    this.queueSchedulerRepository = new QueueSchedulerRepository(queueRepository);
    this.seatSchedulerRepository = new SeatSchedulerRepository(seatRepository);
  }

  // 10분마다
  @Cron(CronExpression.EVERY_MINUTE)
  async activateQueueTokens() {
    try {
      const waitingTokens = await this.queueSchedulerRepository.findWaitingTokens(50);

      if (waitingTokens.length > 0) {
        await this.queueSchedulerRepository.activateTokens(
          waitingTokens.map((token) => token.order),
        );
        this.logger.log(`${waitingTokens.length}만큼의 토큰을 활성화 합니다.`);
      }
    } catch (error) {
      this.logger.error('토큰 활성화 스케쥴러 실패', error);
    }
  }

  // 1분마다 실행
  @Cron(CronExpression.EVERY_MINUTE)
  async expireOldActiveTokens() {
    try {
      const expiredTokens = await this.queueSchedulerRepository.findExpiredActiveTokens();

      if (expiredTokens.length > 0) {
        await this.queueSchedulerRepository.expireTokens(
          expiredTokens.map((token) => token.order),
        );
        this.logger.log(`${expiredTokens.length}만큼의 토큰을 만료합니다.`);
      }
    } catch (error) {
      this.logger.error('오래된 토큰 만료 스케쥴러 실패', error);
    }
  }

  // SeatScheduler 기능 추가
  @Cron(CronExpression.EVERY_MINUTE) // 매 1분마다 실행
  async resetExpiredSeats() {
    this.logger.log('Checking for expired TEMP seats...');
    try {
      const expiredSeats = await this.seatSchedulerRepository.findExpiredTempSeats();

      if (expiredSeats.length > 0) {
        await this.seatSchedulerRepository.resetExpiredTempSeats(
          expiredSeats.map((seat) => seat.seatid),
        );
        this.logger.log(`Reset ${expiredSeats.length} expired TEMP seats to RESERVABLE.`);
      } else {
        this.logger.log('No expired TEMP seats found.');
      }
    } catch (error) {
      this.logger.error('Failed to reset expired TEMP seats', error);
    }
  }
}
