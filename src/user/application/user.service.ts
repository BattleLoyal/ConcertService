import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UserRepositoryImpl } from '../infra/user.repository.impl';
import { UpdateBalanceDto } from '../interface/dto/update-balance.dto';
import { EntityManager } from 'typeorm';
import { ChargeBalanceResponseDto } from '../interface/dto/update-balance-response.dto';
import { User } from '../domain/entity/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly entityManager: EntityManager,
  ) {}

  async chargeBalance(
    userId: number,
    updateBalanceDto: UpdateBalanceDto,
  ): Promise<ChargeBalanceResponseDto> {
    const { amount } = updateBalanceDto;

    // 금액이 0 이하인 경우 예외 처리
    if (amount <= 0) {
      throw new BadRequestException('충전 금액이 음수이거나 0일 수 없습니다.');
    }

    return await this.entityManager.transaction(
      async (manager: EntityManager) => {
        // 잔액 바로 추가 (트랜잭션 내에서 처리)
        await this.userRepository.updateBalanceIncrement(
          userId,
          amount,
          manager,
        );

        // 업데이트된 유저 정보 조회 (트랜잭션 내에서 처리)
        const user = await this.userRepository.findUserById(userId, manager);
        if (!user) {
          throw new NotFoundException('User not found after update.');
        }

        return {
          userId,
          newBalance: user.balance,
        };
      },
    );
  }

  // 잔액 조회
  async getUserBalance(userId: number): Promise<any> {
    const user = await this.userRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException('유저를 찾지 못했습니다.');
    }

    return {
      userId: user.userId,
      balance: user.balance,
    };
  }

  async chargeBalanceWithOptimisticLock(
    userId: number,
    amount: number,
  ): Promise<ChargeBalanceResponseDto> {
    // 사용자 조회
    const user = await this.userRepository.findOne({
      where: { userId },
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    try {
      // 낙관적 락 포인트 충전
      const updateResult = await this.userRepository.update(
        { userId: user.userId, version: user.version },
        { balance: user.balance + amount, version: user.version + 1 },
      );

      // 업데이트된 행이 없으면 충돌이 발생한 것
      if (updateResult.affected === 0) {
        throw new ConflictException(
          '동시에 포인트를 충전하는 요청이 있습니다.',
        );
      }

      return { userId: user.userId, newBalance: user.balance + amount };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('포인트 충전 중 문제가 발생했습니다.');
    }
  }
}
