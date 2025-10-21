// backend/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServersModule } from './servers/servers.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { BotModule } from './bot/bot.module';
import { UploadModule } from './upload/upload.module';
import { DiscordModule } from './discord/discord.module';
import { MailModule } from './mail/mail.module';
import { DeliveryModule } from './delivery/delivery.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Modules métiers
    PrismaModule,
    AuthModule,
    UsersModule,
    ServersModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    BotModule,
    UploadModule,
    DiscordModule,
    MailModule,
    DeliveryModule,
    ReviewsModule, // ✅ CORRECTION : Ajouté dans le tableau imports
  ],
})
export class AppModule {}