import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1)); // proxies in front (hosting + server.mjs)
  app.use(helmet());
  // Token endpoint accepts application/x-www-form-urlencoded (RFC 6749); Nest enables urlencoded by default.
  app.enableCors({
    origin: [process.env.WEB_URL!],
    credentials: false,
  });
  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '127.0.0.1');
}
bootstrap();
