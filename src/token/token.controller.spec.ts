import { Test, TestingModule } from '@nestjs/testing';
import { TokenController } from './token.controller';

describe('TokenController', () => {
  let controller: TokenController;
  //테스트용주석
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenController],
    }).compile();

    controller = module.get<TokenController>(TokenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
