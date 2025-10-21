// backend/src/main.ts - AVEC SUPPORT RAWBODY POUR STRIPE

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS pour permettre au frontend d'accéder à l'API
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL || 'http://localhost:5173',
    ],
    credentials: true,
  });

  // 🆕 CRITIQUE : Middleware pour le rawBody (nécessaire pour les webhooks Stripe)
  // Doit être AVANT le JSON parser global
  app.use(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
  );

  // Parser JSON global (pour toutes les autres routes)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Servir les fichiers statiques (uploads)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Prefix global pour toutes les routes
  app.setGlobalPrefix('api');

  // Documentation Swagger
  const config = new DocumentBuilder()
    .setTitle('Guild Cart API')
    .setDescription('API for Guild Cart - E-commerce platform for Discord servers')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Backend API running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  console.log(`💳 Stripe webhook endpoint: http://localhost:${port}/api/payments/webhook`);
}

bootstrap();