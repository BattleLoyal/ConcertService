import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { User } from './entity/user.entity';
import { UserRepositoryImpl } from './repository/user.repository.impl';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, UserRepositoryImpl],
})
export class UserModule {}
