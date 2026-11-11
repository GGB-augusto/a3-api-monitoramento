import 'reflect-metadata';
import 'dotenv/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarValidacao } from './validation';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configurarValidacao(app);
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3001' });
  app.getHttpAdapter().getInstance().get('/', (_request: unknown, response: { redirect(url: string): unknown }) => {
    response.redirect(process.env.FRONTEND_URL ?? 'http://localhost:3001');
  });
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida');
  await app.listen(port, '127.0.0.1');
  console.log(`API disponível em http://localhost:${port}`);
}
bootstrap().catch((error) => { console.error(error); process.exitCode = 1; });
