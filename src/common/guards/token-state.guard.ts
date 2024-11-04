import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QueueRepositoryImpl } from 'src/queue/infra/queue.repository.impl';

@Injectable()
export class TokenStateGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly queueRepository: QueueRepositoryImpl,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token: string | undefined = request.headers['authorization'];

    console.log(`TokenStateGuard token: ${token}`);

    if (!token) {
      throw new UnauthorizedException('토큰이 없습니다.');
    }

    const [uuid] = token.split('-QUEUE:');
    const isActive = await this.queueRepository.isTokenActive(uuid);

    if (!isActive) {
      throw new UnauthorizedException('토큰 활성화 상태가 아닙니다.');
    }

    return true;
  }
}
