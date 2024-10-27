import { User } from '../domain/entity/user.entity';

export interface UserRepository {
  findUserById(userId: number): Promise<User | null>;
  updateBalanceIncrement(userId: number, amount: number): Promise<void>;
}
