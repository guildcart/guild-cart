import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Nécessaire pour les webhooks Stripe
  });

  // CORS pour permettre au frontend d'accéder à l'API
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL || 'http://localhost:5173',
    ],
    credentials: true,
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
    .setTitle('Discord Shop Bot API')
    .setDescription('API for Discord Shop Bot - E-commerce platform for Discord servers')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Backend API running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();