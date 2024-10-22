// src/queue/repository/queue.repository.impl.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Queue } from '../domain/entity/queue.entity';
import { QueueRepository } from './queue.repository';
import { QueueDataDto } from '../interface/dto/response/position-response.dto';

@Injectable()
export class QueueRepositoryImpl implements QueueRepository {
  constructor(private readonly entityManager: EntityManager) {}

  async insertQueueEntry(
    userId: number,
    uuid: string,
    status: string,
    manager?: EntityManager,
  ): Promise<Queue> {
    const entryManager = manager || this.entityManager;
    const entry = entryManager.create(Queue, {
      UserID: userId,
      UUID: uuid,
      status,
      createdtime: new Date(),
    });
    return await entryManager.save(entry);
  }

  // 대기열 번호 및 상태 조회
  async getQueuePositionByUUID(
    uuid: string,
    manager?: EntityManager,
  ): Promise<QueueDataDto> {
    const entryManager = manager || this.entityManager;
    const queueEntry = await entryManager
      .createQueryBuilder(Queue, 'queue')
      .where('queue.UUID = :uuid', { uuid })
      .getOne();

    if (!queueEntry) {
      throw new NotFoundException('일치하는 대기열이 없습니다.');
    }

    // 자신의 order 값보다 앞에 있는 WAITING 또는 ACTIVE 상태의 항목 개수 카운트
    const position = await entryManager
      .createQueryBuilder(Queue, 'queue')
      .where('queue.status = :status1 OR queue.status = :status2', {
        status1: 'WAITING',
        status2: 'ACTIVE',
      })
      .andWhere('queue.order < :order', { order: queueEntry.order })
      .getCount();

    return {
      position: position,
      status: queueEntry.status,
    };
  }

  async isTokenActive(uuid: string): Promise<boolean> {
    const queueEntry = await this.entityManager
      .createQueryBuilder(Queue, 'queue')
      .where('queue.UUID = :uuid', { uuid })
      .andWhere('queue.status = :status', { status: 'ACTIVE' })
      .getOne();

    return !!queueEntry;
  }

  // 토큰 상태 업데이트
  async updateTokenState(
    uuid: string,
    newState: string,
    manager?: EntityManager,
  ): Promise<void> {
    const entryManager = manager || this.entityManager;
    await entryManager
      .createQueryBuilder()
      .update('queue')
      .set({ status: newState })
      .where('UUID = :uuid', { uuid })
      .execute();
  }
}
