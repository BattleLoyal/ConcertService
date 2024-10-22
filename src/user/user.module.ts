import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './interface/dto/user.controller';
import { UserService } from './application/user.service';
import { User } from './domain/entity/user.entity';
import { UserRepositoryImpl } from './infra/user.repository.impl';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, UserRepositoryImpl],
})
export class UserModule {}
