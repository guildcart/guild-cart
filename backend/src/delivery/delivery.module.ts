// backend/src/delivery/delivery.module.ts

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    HttpModule, // Pour communiquer avec le bot Discord
    MailModule, // Pour envoyer les emails
    PrismaModule, // Pour accéder à la BDD
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}