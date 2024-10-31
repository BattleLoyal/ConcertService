import { User } from '../domain/entity/user.entity';
import { Repository } from 'typeorm';

export abstract class UserRepository extends Repository<User> {
  abstract findUserById(userId: number): Promise<User | null>;
  abstract updateBalanceIncrement(
    userId: number,
    amount: number,
  ): Promise<void>;
}
