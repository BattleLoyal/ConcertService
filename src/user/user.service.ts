import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserRepositoryImpl } from './repository/user.repository.impl';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { EntityManager } from 'typeorm';
import { ChargeBalanceResponseDto } from './dto/update-balance-response.dto';

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
}
