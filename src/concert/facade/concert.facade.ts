import { Injectable, NotFoundException } from '@nestjs/common';
import { ConcertService } from '../concert.service';
import { QueueRepositoryImpl } from '../../queue/repository/queue.repository.impl'; // QueueRepository 임포트

@Injectable()
export class ConcertFacade {
  constructor(
    private readonly concertService: ConcertService,
    private readonly queueRepository: QueueRepositoryImpl,
  ) {}
}
