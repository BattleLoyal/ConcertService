import { Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@liaoliaots/nestjs-redis';

@Module({
  imports: [
    NestRedisModule.forRoot({
      config: {
        host: 'localhost', // Redis 호스트
        port: 6379, // Redis 포트
      },
    }),
  ],
  exports: [NestRedisModule],
})
export class RedisModule {}