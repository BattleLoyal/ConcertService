import { Repository, LessThan } from 'typeorm';
import { Queue } from '../queue/domain/entity/queue.entity';

export class QueueSchedulerRepository {
  constructor(private readonly repository: Repository<Queue>) {}

  async findWaitingTokens(limit: number): Promise<Queue[]> {
    return this.repository.find({
      where: { status: 'WAITING' },
      order: { createdtime: 'ASC' },
      take: limit,
    });
  }

  async activateTokens(tokenIds: number[]): Promise<void> {
    const currentTime = new Date();
    await this.repository.createQueryBuilder()
      .update(Queue)
      .set({ status: 'ACTIVE', activatedtime: currentTime })
      .whereInIds(tokenIds)
      .execute();
  }

  async findExpiredActiveTokens(): Promise<Queue[]> {
    const expirationThreshold = new Date(Date.now() - 5 * 60 * 1000);
    return this.repository.find({
      where: { status: 'ACTIVE', activatedtime: LessThan(expirationThreshold) },
    });
  }

  async expireTokens(tokenIds: number[]): Promise<void> {
    await this.repository.createQueryBuilder()
      .update(Queue)
      .set({ status: 'EXPIRE' })
      .whereInIds(tokenIds)
      .execute();
  }
}
