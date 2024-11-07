import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Seat } from 'src/concert/domain/entity/seat.entity';
import { Performance } from 'src/concert/domain/entity/performance.entity';
import { Queue } from 'src/queue/domain/entity/queue.entity';
import { Concert } from 'src/concert/domain/entity/concert.entity';
import { User } from 'src/user/domain/entity/user.entity';
import { Reservation } from 'src/concert/domain/entity/reservation.entity';

export const getDBConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_DATABASE'),
  entities: [Seat, Performance, Queue, Concert, User, Reservation],
  synchronize: true,
  dropSchema: true, // 테스트용도
  timezone: '+09:00',
  extra: {
    connectionLimit: 20,
  },
  //logging: true,
});
