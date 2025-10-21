// backend/src/mail/mail.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

interface OrderConfirmationData {
  orderId: string;
  buyerEmail: string;
  buyerUsername: string;
  productName: string;
  productType: 'PDF' | 'SERIAL' | 'ROLE';
  amount: number;
  shopName: string;
  deliveryToken?: string;
  reviewToken: string;
  fileUrl?: string; // Pour PDF
  roleName?: string; // Pour ROLE
  serialsCount?: number; // Pour SERIAL
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly frontendUrl: string;

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  /**
   * Envoyer l'email de confirmation de commande
   */
  async sendOrderConfirmation(data: OrderConfirmationData) {
    try {
      // Construire les liens
      const deliveryLink = data.deliveryToken
        ? `${this.frontendUrl}/delivery/${data.deliveryToken}`
        : null;

      const downloadLink = data.fileUrl
        ? `${this.frontendUrl}/api/uploads/${data.fileUrl}`
        : null;

      const reviewLink = `${this.frontendUrl}/review/${data.reviewToken}`;

      // Construire le message selon le type de produit
      let deliveryMessage = '';
      let deliveryButton = '';

      if (data.productType === 'SERIAL') {
        deliveryMessage = `🔑 Vos ${data.serialsCount} clé(s) sont disponibles en ligne`;
        deliveryButton = `<a href="${deliveryLink}" style="display: inline-block; background-color: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 0;">Accéder à vos clés</a>`;
      } else if (data.productType === 'PDF') {
        deliveryMessage = '📄 Votre document est prêt à être téléchargé';
        deliveryButton = `<a href="${downloadLink}" style="display: inline-block; background-color: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 0;">Télécharger le PDF</a>`;
      } else if (data.productType === 'ROLE') {
        deliveryMessage = `👑 Votre rôle "${data.roleName}" a été ajouté sur Discord !`;
        deliveryButton = `<p style="color: #10B981; font-weight: 600; margin: 10px 0;">✅ Rôle attribué automatiquement</p>`;
      }

      // Envoyer l'email
      const info = await this.mailerService.sendMail({
        to: data.buyerEmail,
        subject: `Commande confirmée - ${data.shopName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Commande confirmée !</h1>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                          Bonjour <strong>${data.buyerUsername}</strong>,
                        </p>
                        
                        <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
                          Votre commande a été traitée avec succès ! Voici les détails :
                        </p>
                        
                        <!-- Order Details -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                          <tr>
                            <td style="padding: 10px 0;">
                              <strong style="color: #6b7280;">Commande #:</strong>
                              <span style="color: #111827;">${data.orderId.slice(0, 8)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0;">
                              <strong style="color: #6b7280;">Produit :</strong>
                              <span style="color: #111827;">${data.productName}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0;">
                              <strong style="color: #6b7280;">Montant :</strong>
                              <span style="color: #111827; font-size: 18px; font-weight: 600;">${data.amount.toFixed(2)}€</span>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Delivery Section -->
                        <div style="background-color: #ede9fe; border-left: 4px solid #7C3AED; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                          <p style="margin: 0 0 10px 0; color: #6b21a8; font-weight: 600;">
                            ${deliveryMessage}
                          </p>
                          <div style="text-align: center;">
                            ${deliveryButton}
                          </div>
                        </div>
                        
                        <!-- Review Section -->
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                          <p style="margin: 0 0 10px 0; color: #92400e; font-weight: 600;">
                            ⭐ Votre avis compte !
                          </p>
                          <p style="margin: 0 0 15px 0; color: #78350f; font-size: 14px;">
                            Aidez-nous à améliorer notre service en laissant un avis sur votre achat.
                          </p>
                          <div style="text-align: center;">
                            <a href="${reviewLink}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Laisser un avis</a>
                          </div>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                          Merci pour votre achat sur <strong>${data.shopName}</strong> !
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                          Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
                          Powered by <strong>Guild Cart</strong>
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      this.logger.log(`✅ Email de confirmation envoyé à ${data.buyerEmail}`);
      
      // En développement avec Ethereal, afficher le lien de prévisualisation
      if (process.env.NODE_ENV === 'development' && info.messageId) {
        const nodemailer = require('nodemailer');
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          this.logger.log(`📬 Prévisualiser l'email : ${previewUrl}`);
        }
      }
      
      return true;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'envoi de l'email à ${data.buyerEmail}:`, error);
      throw error;
    }
  }
}