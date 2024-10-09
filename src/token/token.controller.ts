import { Controller, Post, Body, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('token')
export class TokenController {
  @Post('issue')
  issueToken(@Body() body: any, @Res() response: Response): any {
    const { concertId } = body;

    if (concertId) {
      response.setHeader('Token', 'tokenvalue');

      return response.status(200).json({
        tokenState: 'WAIT',
      });
    } else {
      return response.status(500);
    }
  }

  @Post('status')
  statusToken(@Body() body: any, @Res() response: Response): any {
    const { concertId } = body;

    if (concertId) {
      response.setHeader('Token', 'tokenvalue');

      return response.status(200).json({
        tokenState: 'WAIT',
      });
    } else {
      return response.status(500);
    }
  }
}
