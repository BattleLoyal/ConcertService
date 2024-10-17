import { Body, Controller, Get, Post, Req, Res, Headers } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueueService } from './queue.service';
import { CreateTokenDto } from './dto/create-token.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';

@ApiTags('waiting-queue')
@Controller('waiting-queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  @ApiOperation({
    summary: '토큰 발급',
    description: '대기열 토큰을 발급합니다.',
  })
  @ApiBody({ type: CreateTokenDto })
  @ApiResponse({
    status: 200,
    description: '토큰 발급 성공',
    schema: { example: { tokenState: 'WAITING' } },
  })
  async issueToken(
    @Body() createTokenDto: CreateTokenDto,
    @Res() res: Response,
  ): Promise<any> {
    const { token, tokenState } =
      await this.queueService.issueToken(createTokenDto);

    // 응답 헤더에 UUID-QUEUE:대기열번호 토큰 추가
    res.setHeader('X-Token', token);
    const responseBody = { tokenState };
    return res.status(200).json(responseBody);
  }

  @Get()
  @ApiOperation({
    summary: '대기열 조회',
    description: '유저의 대기열 상태 및 순서를 조회합니다.',
  })
  @ApiHeader({ name: 'X-Token', description: '대기열 토큰', required: true })
  @ApiResponse({
    status: 200,
    description: '대기열 조회 성공',
    schema: { example: { tokenState: 'WAITING' } },
  })
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

    const responseBody = { tokenState };

    return res.status(200).json(responseBody);
  }
}
