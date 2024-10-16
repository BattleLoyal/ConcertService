import { Body, Controller, Get, Post, Req, Res, Headers } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueueService } from './queue.service';
import { CreateTokenDto } from './dto/create-token.dto';

@Controller('waiting-queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  async issueToken(
    @Body() createTokenDto: CreateTokenDto,
    @Res() res: Response,
  ): Promise<any> {
    const { token, tokenState } =
      await this.queueService.issueToken(createTokenDto);

    // 응답 헤더에 UUID-QueueNumber 형식의 토큰 추가
    res.setHeader('X-Token', token);

    return res.status(200).json(tokenState);
  }

  @Get()
  async getQueuePosition(
    @Headers('X-Token') tokenHeader: string,
    @Res() res: Response,
  ) {
    const [uuid] = tokenHeader.split('-QUEUE:');

    // UUID로 대기열 순서 조회
    const { token, tokenState } =
      await this.queueService.getMyQueuePosition(uuid);

    // 대기열 순서를 헤더에 추가
    res.setHeader('X-Token', token);

    return res.status(200).json(tokenState);
  }
}
