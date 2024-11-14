import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Concert')
    .setDescription('Concert Reservation Queue API')
    .setVersion('1.0')
    .addTag('Concert')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, () => document);

  fs.writeFileSync('./swagger.json', JSON.stringify(document));

  await app.listen(4000);
}
bootstrap();
