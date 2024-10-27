// src/queue/queue.service.ts
import { Injectable } from '@nestjs/common';
import { QueueRepositoryImpl } from '../infra/queue.repository.impl';
import { CreateTokenDto } from '../interface/dto/request/create-token.dto';
import { v4 } from 'uuid';
import { EntityManager } from 'typeorm';
import { TokenResponse } from '../interface/dto/response/token-response.dto';

@Injectable()
export class QueueService {
  constructor(
    private readonly queueRepository: QueueRepositoryImpl,
    private readonly entityManager: EntityManager,
  ) {}

  async issueToken(createTokenDto: CreateTokenDto): Promise<TokenResponse> {
    const { userId } = createTokenDto;
    const uuid = v4(); // UUID 생성

    // EntityManager의 transaction 메서드를 사용하여 트랜잭션 처리
    return await this.entityManager.transaction(
      async (manager: EntityManager) => {
        // 대기열 항목 삽입
        await this.queueRepository.insertQueueEntry(
          userId,
          uuid,
          'WAITING',
          manager,
        ); // manager 전달

        // 내 앞의 대기 인원
        const queue = await this.queueRepository.getQueuePositionByUUID(
          uuid,
          manager,
        );

        // 내 순서 정보를 토큰에 넣음
        const token = `${uuid}-QUEUE:${queue.position + 1}`;

        return { token, tokenState: queue.status };
      },
    );
  }

  // UUID로 대기열 순서를 조회하는 메서드 추가
  async getMyQueuePosition(uuid: string): Promise<TokenResponse> {
    const { position, status } =
      await this.queueRepository.getQueuePositionByUUID(uuid);

    const token = `${uuid}-QUEUE:${position}`;

    return { token, tokenState: status };
  }
}
