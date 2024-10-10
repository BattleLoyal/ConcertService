import { Controller, Post, Get, Body, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('token')
export class TokenController {
  @Post('issue')
  issueToken(@Body() body: any, @Res() response: Response): any {
    const { UUID } = body;

    if (UUID) {
      response.setHeader('Token', 'tokenvalue');

      return response.status(200).json({
        tokenState: 'WAIT',
      });
    } else {
      return response.status(500);
    }
  }

  @Get('status')
  statusToken(@Req() request: Request, @Res() response: Response): any {
    if (request.header('Token')) {
      response.setHeader('Token', 'tokenvalue');
      return response.status(200).json({
        tokenState: 'WAIT',
      });
    } else {
      return response.status(500);
    }
  }
}
