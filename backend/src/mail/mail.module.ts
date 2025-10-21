// backend/src/mail/mail.module.ts

import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // En développement, utiliser Ethereal Email (compte de test automatique)
        let transport;
        
        if (process.env.NODE_ENV === 'development') {
          // Créer un compte Ethereal automatiquement
          const nodemailer = require('nodemailer');
          const testAccount = await nodemailer.createTestAccount();
          
          transport = {
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          };
          
          console.log('📧 Compte email de test créé :');
          console.log('   User:', testAccount.user);
          console.log('   Pass:', testAccount.pass);
          console.log('   📬 Voir les emails : https://ethereal.email/messages');
        } else {
          // En production, utiliser les vraies credentials
          transport = {
            host: configService.get('MAIL_HOST', 'smtp.gmail.com'),
            port: configService.get('MAIL_PORT', 587),
            secure: false,
            auth: {
              user: configService.get('MAIL_USER'),
              pass: configService.get('MAIL_PASSWORD'),
            },
          };
        }
        
        return {
          transport,
          defaults: {
            from: `"Guild Cart" <${configService.get('MAIL_FROM', 'noreply@guildcart.com')}>`,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}