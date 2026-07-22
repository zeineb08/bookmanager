import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Security HTTP Headers
  app.use(helmet());

  app.setGlobalPrefix('api');

  // Secure CORS origin (avoid wildcard fallback in production)
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    credentials: true,
  });

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // auto-convert query string numbers to types
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('BookManager API')
    .setDescription('Library Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
