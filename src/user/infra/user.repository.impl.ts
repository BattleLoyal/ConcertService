import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { User } from '../domain/entity/user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(private readonly entityManager: EntityManager) {}

  // 유저를 ID로 조회 (EntityManager 선택적 사용)
  async findUserById(
    userId: number,
    manager?: EntityManager,
  ): Promise<User | null> {
    const entity = manager || this.entityManager; // 매니저가 있으면 사용, 없으면 기본 entityManager 사용
    return await entity
      .createQueryBuilder(User, 'user')
      .where('user.userId = :userId', { userId })
      .getOne();
  }

  // 잔액을 업데이트 (EntityManager 선택적 사용)
  async updateBalance(
    userId: number,
    newBalance: number,
    manager?: EntityManager,
  ): Promise<void> {
    const entity = manager || this.entityManager; // 매니저가 있으면 사용, 없으면 기본 entityManager 사용
    await entity
      .createQueryBuilder()
      .update(User)
      .set({ balance: newBalance })
      .where('userId = :userId', { userId })
      .execute();
  }

  // 잔액을 추가 (조회 없이 바로 업데이트) (EntityManager 선택적 사용)
  async updateBalanceIncrement(
    userId: number,
    amount: number,
    manager?: EntityManager,
  ): Promise<void> {
    const entity = manager || this.entityManager; // 매니저가 있으면 사용, 없으면 기본 entityManager 사용
    await entity
      .createQueryBuilder()
      .update(User)
      .set({ balance: () => `balance + ${amount}` }) // 기존 잔액에 추가
      .where('userId = :userId', { userId })
      .execute();
  }
}
