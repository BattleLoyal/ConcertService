import { Performance } from '../domain/entity/performance.entity';
import { EntityManager } from 'typeorm';

export interface PerformanceRepository {
  getAvailableDates(
    concertId: number,
    startDate: Date,
    manager?: EntityManager,
  ): Promise<Performance[]>;
  getPerformanceByConcertAndDate(
    concertId: number,
    date: string,
    manager?: EntityManager,
  ): Promise<Performance | null>;
}
