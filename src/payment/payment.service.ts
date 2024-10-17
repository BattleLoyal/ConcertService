import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepositoryImpl } from '../user/repository/user.repository.impl';
import { SeatRepositoryImpl } from '../concert/repository/seat.repository.impl';
import { QueueRepositoryImpl } from '../queue/repository/queue.repository.impl';
import { ReservationRepositoryImpl } from '../concert/repository/reservation.repository.impl';
import { PaymentRepositoryImpl } from './repository/payment.repository.impl';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { EntityManager } from 'typeorm';
import { PerformanceRepositoryImpl } from 'src/concert/repository/performance.repository.impl';

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
  ) {}

  async processPayment(
    token: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<any> {
    const { userId, concertId, date, seatNumber } = createPaymentDto;

    return await this.entityManager.transaction(
      async (manager: EntityManager) => {
        // 토큰 상태 확인
        const [uuid] = token.split('-QUEUE:');
        const isActive = await this.queueRepository.isTokenActive(uuid);
        if (!isActive) {
          throw new UnauthorizedException('대기열에 활성되지 않았습니다.');
        }

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
        await this.seatRepository.updateSeatStatus(
          seat.seatid,
          'RESERVED',
          manager,
        );

        // 예약 테이블에 예약 정보 저장
        await this.reservationRepository.insertReservation(
          seat.seatid,
          userId,
          paymentId,
          manager,
        );

        // 유저 잔액 차감
        const newBalance = user.balance - amount;
        await this.userRepository.updateBalance(userId, newBalance, manager);

        // 토큰 상태를 EXPIRE로 변경
        await this.queueRepository.updateTokenState(uuid, 'EXPIRE', manager);

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
}
