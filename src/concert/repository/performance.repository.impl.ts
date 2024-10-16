import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Performance } from '../entity/performance.entity';
import { PerformanceRepository } from './performance.repository';

@Injectable()
export class PerformanceRepositoryImpl implements PerformanceRepository {
  constructor(private readonly entityManager: EntityManager) {}

  async getAvailableDates(
    concertId: number,
    startDate: string,
    manager?: EntityManager,
  ): Promise<Performance[]> {
    const performanceManager = manager || this.entityManager;

    return await performanceManager
      .createQueryBuilder(Performance, 'performance')
      .where('performance.concertid = :concertId', { concertId })
      .andWhere('performance.date >= :startDate', { startDate })
      .getMany();
  }
}
