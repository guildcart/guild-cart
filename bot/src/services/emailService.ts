import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// Configuration du transporteur email
let transporter: nodemailer.Transporter | null = null;

export function initializeEmailService() {
  try {
    if (process.env.EMAIL_SERVICE === 'smtp') {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
    // TODO: Ajouter support pour Resend/SendGrid
    
    logger.info('✅ Service email initialisé');
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation du service email:', error);
  }
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  if (!transporter) {
    initializeEmailService();
  }

  if (!transporter) {
    throw new Error('Service email non configuré');
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@discord-shop.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    logger.info(`📧 Email envoyé: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
}