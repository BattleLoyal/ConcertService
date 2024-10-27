import { QueueDataDto } from '../interface/dto/response/position-response.dto';
import { Queue } from '../domain/entity/queue.entity';
import { EntityManager } from 'typeorm';

export interface QueueRepository {
  insertQueueEntry(
    userId: number,
    uuid: string,
    status: string,
    manager?: EntityManager,
  ): Promise<Queue>;
  getQueuePositionByUUID(uuid: string): Promise<QueueDataDto>;
  isTokenActive(uuid: string): Promise<boolean>;
  updateTokenState(
    uuid: string,
    newState: string,
    manager?: EntityManager,
  ): Promise<void>;
}
