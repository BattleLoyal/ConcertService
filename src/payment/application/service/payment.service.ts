import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UserRepositoryImpl } from '../../../user/infra/user.repository.impl';
import { SeatRepositoryImpl } from '../../../concert/infra/seat.repository.impl';
import { QueueRepositoryImpl } from '../../../queue/infra/queue.repository.impl';
import { ReservationRepositoryImpl } from '../../../concert/infra/reservation.repository.impl';
import { PaymentRepositoryImpl } from '../../infra/payment.repository.impl';
import { CreatePaymentDto } from '../../interface/dto/create-payment.dto';
import { EntityManager } from 'typeorm';
import { PerformanceRepositoryImpl } from 'src/concert/infra/performance.repository.impl';
import { KafkaProducer } from 'src/kafka/kafka-producer';
import { OutboxRepository } from 'src/common/outbox/outbox.repository';

@Injectable()
export class PaymentService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly seatRepository: SeatRepositoryImpl,
    private readonly queueRepository: QueueRepositoryImpl,
    private readonly reservationRepository: ReservationRepositoryImpl,
    private readonly performanceRepository: PerformanceRepositoryImpl,
    private readonly paymentRepository: PaymentRepositoryImpl,
    private readonly entityManager: EntityManager,
    private readonly kafkaProducer: KafkaProducer,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  async processPayment(
    token: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<any> {
    const { userId, concertId, date, seatNumber } = createPaymentDto;
    return await this.entityManager.transaction(
      async (manager: EntityManager) => {
        // 유저 조회
        const user = await this.userRepository.findUserById(userId, manager);
        if (!user) {
          throw new NotFoundException('해당 유저를 찾을 수 없습니다.');
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

        // 좌석 임시 예약 상태 확인
        const seat = await this.seatRepository.getTempReservedSeat(
          performance.performanceid,
          seatNumber,
          userId,
          manager,
        );
        if (!seat) {
          throw new BadRequestException('해당 좌석을 예약할 수 없습니다.');
        }

        // 잔액이 충분한지 확인
        const amount = seat.price;
        if (user.balance < amount) {
          // 결제 실패 처리
          await this.paymentRepository.insertPaymentRecord(
            userId,
            'fail',
            amount,
            manager,
          );
          throw new BadRequestException('잔액이 부족합니다.');
        }

        // 결제 성공 처리
        const paymentId = await this.paymentRepository.insertPaymentRecord(
          userId,
          'success',
          amount,
          manager,
        );

        // 좌석 상태 업데이트
        const seatResult = await this.seatRepository.updateSeatStatus(
          seat.seatid,
          'RESERVED',
          manager,
        );
        if (!seatResult) {
          throw new ConflictException('해당 좌석을 예약하지 못했습니다.');
        }

        // 예약 테이블에 예약 정보 저장
        await this.reservationRepository.insertReservation(
          seat.seatid,
          userId,
          paymentId,
          manager,
        );

        // 유저 잔액 차감
        const newBalance = user.balance - amount;
        const balanceUpdateResult = await this.userRepository.updateBalance(
          userId,
          newBalance,
          manager,
        );
        if (!balanceUpdateResult) {
          throw new ConflictException('잔액 차감에 실패했습니다.');
        }

        // 토큰 상태를 EXPIRE로 변경
        const [uuid] = token.split('-QUEUE:');
        await this.queueRepository.updateTokenState(uuid, 'EXPIRE', manager);

        // 카프카
        const orderInfo = {
          userId: userId,
          seat: seat.seatid,
          paymentId: paymentId,
        };
        await this.kafkaProducer.send('order', [
          { value: JSON.stringify(orderInfo) },
        ]);
        // Outbox Pattern
        const payload = JSON.stringify(orderInfo);
        await this.outboxRepository.saveOutboxMessage('order', payload);

        return {
          status: 'Success',
          tokenState: 'Expired',
          userId,
          performanceId: performance.performanceid,
          seatNumber,
          amount,
          balance: newBalance,
        };
      },
    );
  }

  // 낙관적락 - 좌석 결제
  async processPaymentWithOptimisticLock(
    token: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<any> {
    const { userId, concertId, date, seatNumber } = createPaymentDto;
    return await this.entityManager.transaction(
      async (manager: EntityManager) => {
        // 유저 조회
        const user = await this.userRepository.findOne({ where: { userId } });
        if (!user) {
          throw new NotFoundException('해당 유저를 찾을 수 없습니다.');
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

        // 좌석 임시 예약 상태 확인
        const seat = await this.seatRepository.getTempReservedSeat(
          performance.performanceid,
          seatNumber,
          userId,
          manager,
        );
        if (!seat) {
          throw new BadRequestException('해당 좌석을 예약할 수 없습니다.');
        }

        // 잔액이 충분한지 확인
        const amount = seat.price;
        if (user.balance < amount) {
          // 결제 실패 처리
          await this.paymentRepository.insertPaymentRecord(
            userId,
            'fail',
            amount,
            manager,
          );
          throw new BadRequestException('잔액이 부족합니다.');
        }

        // 낙관적 락을 통한 포인트 차감 및 버전 업데이트
        const userUpdateResult = await this.userRepository.update(
          { userId: user.userId, version: user.version },
          { balance: () => `balance - ${amount}`, version: user.version + 1 },
        );

        if (!userUpdateResult) {
          throw new ConflictException('결제 동시 시도 요청이 있습니다.');
        }

        // 낙관적 락을 통한 좌석 예약 완료
        const seatUpdateResult = await this.seatRepository.update(
          {
            userId: seat.userId,
            seatid: seat.seatid,
            status: 'TEMP',
            version: seat.version,
          },
          { status: 'DONE', version: seat.version + 1 },
        );

        if (seatUpdateResult.affected === 0) {
          throw new ConflictException(
            '해당 좌석을 예약하지 못했습니다. 다른 사용자가 예약했을 수 있습니다.',
          );
        }

        // 결제 내역 저장
        const paymentId = await this.paymentRepository.insertPaymentRecord(
          userId,
          'success',
          amount,
          manager,
        );

        // 예약 테이블에 예약 정보 저장
        await this.reservationRepository.insertReservation(
          seat.seatid,
          userId,
          paymentId,
          manager,
        );

        // 토큰 상태를 EXPIRE로 변경
        const [uuid] = token.split('-QUEUE:');
        await this.queueRepository.updateTokenState(uuid, 'EXPIRE', manager);

        return {
          status: 'Success',
          tokenState: 'Expired',
          userId,
          performanceId: performance.performanceid,
          seatNumber,
          amount,
          balance: user.balance - amount,
        };
      },
    );
  }
}
