import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueSchedulerRepository } from './queuescheduler.repository';
import { Queue } from '../queue/domain/entity/queue.entity';
import { Seat } from '../concert/domain/entity/seat.entity';
import { SeatSchedulerRepository } from './seatscheduler.repository';
import { OutboxRepository } from 'src/common/outbox/outbox.repository';
import { KafkaProducer } from 'src/kafka/kafka-producer';

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
    private readonly outboxRepository: OutboxRepository,
    private readonly kafkaProducer: KafkaProducer,
  ) {
    this.queueSchedulerRepository = new QueueSchedulerRepository(
      queueRepository,
    );
    this.seatSchedulerRepository = new SeatSchedulerRepository(seatRepository);
  }

  // 1분마다
  @Cron(CronExpression.EVERY_MINUTE)
  async activateQueueTokens() {
    try {
      const waitingTokens =
        await this.queueSchedulerRepository.findWaitingTokens(50);

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

  // 1분마다
  @Cron(CronExpression.EVERY_MINUTE)
  async expireOldActiveTokens() {
    try {
      const expiredTokens =
        await this.queueSchedulerRepository.findExpiredActiveTokens();

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

  // 1분마다
  @Cron(CronExpression.EVERY_MINUTE)
  async resetExpiredSeats() {
    try {
      const expiredSeats =
        await this.seatSchedulerRepository.findExpiredTempSeats();

      if (expiredSeats.length > 0) {
        await this.seatSchedulerRepository.resetExpiredTempSeats(
          expiredSeats.map((seat) => seat.seatid),
        );
        this.logger.log(
          `${expiredSeats.length}만큼의 만료된 임시 예약 좌석을 예약 가능상태로 변경합니다.`,
        );
      }
    } catch (error) {
      this.logger.error('임시 예약 좌석 만료 스케쥴러 실패', error);
    }
  }

  // 10초 간격
  @Cron(CronExpression.EVERY_10_SECONDS)
  async processOutboxMessages(): Promise<void> {
    const messages = await this.outboxRepository.getUnprocessedMessages();

    for (const message of messages) {
      try {
        console.log(`Processing Outbox message ID: ${message.id}`);
        await this.kafkaProducer.send(message.topic, [
          { value: message.payload },
        ]);
        await this.outboxRepository.markAsProcessed(message.id);
      } catch (error) {
        console.error(
          `Failed to process Outbox message ID: ${message.id}`,
          error,
        );
      }
    }
  }
}
