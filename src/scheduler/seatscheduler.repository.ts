import { Repository, LessThan } from 'typeorm';
import { Seat } from '../concert/domain/entity/seat.entity';

export class SeatSchedulerRepository {
  constructor(private readonly repository: Repository<Seat>) {}

  async findExpiredTempSeats(): Promise<Seat[]> {
    const expirationThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5분 전 시간
    return this.repository.find({
      where: { status: 'TEMP', expire: LessThan(expirationThreshold) },
    });
  }

  async resetExpiredTempSeats(seatIds: number[]): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Seat)
      .set({ status: 'RESERVABLE', expire: null }) // 다시 예약 가능으로 변경
      .whereInIds(seatIds)
      .execute();
  }
}
