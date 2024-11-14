import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Concert } from './concert/domain/entity/concert.entity';
import { Performance } from './concert/domain/entity/performance.entity';
import { Seat } from './concert/domain/entity/seat.entity';
import { User } from 'src/user/domain/entity/user.entity';
import { Queue } from 'src/queue/domain/entity/queue.entity';

@Injectable()
export class DataInitializerService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.insertTestData();
  }

  private async insertTestData() {
    const concertRepository = this.dataSource.getRepository(Concert);
    const performanceRepository = this.dataSource.getRepository(Performance);
    const seatRepository = this.dataSource.getRepository(Seat);
    const userRepository = this.dataSource.getRepository(User);
    const queueRepository = this.dataSource.getRepository(Queue);

    // 콘서트
    // 따로 DB 데이터 추가했음
    /*
    const concert = new Concert();
    concert.title = 'Test Concert';
    concert.singer = 'Test Singer';
    concert.location = 'Test Location';
    await concertRepository.save(concert);

    // 공연
    const performances = [];
    for (let i = 0; i < 10; i++) {
      const performance = new Performance();
      performance.concertid = concert.concertid;
      const date = new Date();
      date.setDate(date.getDate() + i);
      performance.date = date;
      performances.push(performance);
    }
    await performanceRepository.save(performances);

    // 좌석
    for (const performance of performances) {
      const seats = [];
      for (let j = 0; j < 50; j++) {
        const seat = new Seat();
        seat.performanceId = performance.performanceid;
        seat.seatnumber = j + 1;
        seat.price = 100;
        seat.status = 'RESERVABLE';
        seats.push(seat);
      }
      await seatRepository.save(seats);
    }
    */

    // 유저 및 대기열
    const users = [];
    const queues = [];
    for (let k = 0; k < 100; k++) {
      const user = new User();
      user.balance = 3000;
      await userRepository.save(user);
      users.push(user);

      const queue = new Queue();
      queue.UserID = user.userId;
      queue.UUID = `UUIDTEST${k + 1}`;
      queue.status = 'ACTIVE';
      queue.createdtime = new Date();
      queue.activatedtime = new Date();
      queues.push(queue);
    }
    await queueRepository.save(queues);

    console.log('Test data inserted successfully');
  }
}
