import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  configuredAllowedOrigins,
  isAllowedBrowserOrigin,
} from './auth/origin-policy';

type CreateNestAppOptions = {
  enableShutdownHooks?: boolean;
};

export async function createNestApp(options: CreateNestAppOptions = {}) {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = configuredAllowedOrigins(process.env.FRONTEND_ORIGIN);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (isAllowedOrigin(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }
      // Do not turn an untrusted browser origin into a server error. With no
      // CORS headers the browser blocks the response, while the CSRF guard
      // separately rejects every unsafe request from that origin.
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  if (options.enableShutdownHooks ?? true) {
    app.enableShutdownHooks();
  }
  return app;
}

function isAllowedOrigin(
  origin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!origin) return true;
  return isAllowedBrowserOrigin(origin, allowedOrigins);
}
