import { Injectable, NotFoundException } from '@nestjs/common';
import { ConcertService } from '../application/service/concert.service';
import { QueueRepositoryImpl } from '../../queue/infra/queue.repository.impl'; // QueueRepository 임포트

@Injectable()
export class ConcertFacade {
  constructor(
    private readonly concertService: ConcertService,
    private readonly queueRepository: QueueRepositoryImpl,
  ) {}
}
