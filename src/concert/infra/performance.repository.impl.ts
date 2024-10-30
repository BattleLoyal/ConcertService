import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Performance } from '../domain/entity/performance.entity';
import { PerformanceRepository } from './performance.repository';

@Injectable()
export class PerformanceRepositoryImpl implements PerformanceRepository {
  constructor(private readonly entityManager: EntityManager) {}

  async getAvailableDates(
    concertId: number,
    startDate: Date,
    manager?: EntityManager,
  ): Promise<Performance[]> {
    const performanceManager = manager || this.entityManager;

    return await performanceManager
      .createQueryBuilder(Performance, 'performance')
      .where('performance.concertid = :concertId', { concertId })
      .andWhere('DATE(performance.date) >= DATE(:startDate)', { startDate })
      .getMany();
  }

  async getPerformanceByConcertAndDate(
    concertId: number,
    date: string,
    manager?: EntityManager,
  ): Promise<Performance | null> {
    const performanceManager = manager || this.entityManager;
    return await performanceManager
      .createQueryBuilder(Performance, 'performance')
      .where('performance.concertid = :concertId', { concertId })
      .andWhere('performance.date = :date', { date })
      .getOne();
  }

  async savePerformance(performData: Partial<Performance>): Promise<Performance> {
    const perform = this.entityManager.create(Performance, performData);
    return await this.entityManager.save(perform);
  }
}
