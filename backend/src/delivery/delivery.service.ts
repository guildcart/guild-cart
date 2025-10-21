// backend/src/delivery/delivery.service.ts

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);
  private readonly botApiUrl: string;
  private readonly botApiKey: string;
  private readonly frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.botApiUrl = this.configService.get<string>('BOT_API_URL', 'http://localhost:3001');
    this.botApiKey = this.configService.get<string>('BOT_API_KEY', '');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  /**
   * Livrer une commande après un paiement réussi
   */
  async deliverOrder(orderId: string) {
    this.logger.log(`🚀 Début de la livraison pour la commande ${orderId}`);

    try {
      // Récupérer la commande avec toutes les relations
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          product: true,
          buyer: true,
          server: true,
        },
      });

      if (!order) {
        throw new BadRequestException('Commande introuvable');
      }

      if (order.delivered) {
        this.logger.warn(`⚠️ Commande ${orderId} déjà livrée`);
        return;
      }

      // Livraison selon le type de produit
      switch (order.product.type) {
        case 'SERIAL':
          await this.deliverSerial(order);
          break;
        case 'PDF':
          await this.deliverPdf(order);
          break;
        case 'ROLE':
          await this.deliverRole(order);
          break;
        default:
          throw new BadRequestException(`Type de produit non géré: ${order.product.type}`);
      }

      // Marquer comme livré
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          delivered: true,
          deliveredAt: new Date(),
        },
      });

      this.logger.log(`✅ Commande ${orderId} livrée avec succès`);
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la livraison de ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Livrer des SERIAL (clés produit)
   */
  private async deliverSerial(order: any) {
    this.logger.log(`🔑 Livraison de serials pour ${order.id}`);

    // Parser les serials depuis le produit
    let serials: string[] = [];
    try {
      serials = JSON.parse(order.product.serialCredentials || '[]');
    } catch (error) {
      throw new BadRequestException('Serials invalides dans le produit');
    }

    if (serials.length === 0) {
      throw new BadRequestException('Aucun serial disponible pour ce produit');
    }

    // Prendre le premier serial disponible et le retirer du stock
    const assignedSerial = serials.shift();
    
    // Mettre à jour le produit avec les serials restants
    await this.prisma.product.update({
      where: { id: order.product.id },
      data: {
        serialCredentials: JSON.stringify(serials),
        stock: serials.length, // Mettre à jour le stock
      },
    });

    // Stocker le serial dans deliveryData
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        deliveryData: JSON.stringify({ serials: [assignedSerial] }),
      },
    });

    // Envoyer l'email
    await this.mailService.sendOrderConfirmation({
      orderId: order.id,
      buyerEmail: order.buyer.email || 'no-email@example.com',
      buyerUsername: order.buyer.username,
      productName: order.product.name,
      productType: 'SERIAL',
      amount: order.amount,
      shopName: order.server.shopName,
      deliveryToken: order.deliveryToken,
      reviewToken: order.reviewToken,
      serialsCount: 1,
    });

    // Envoyer message Discord
    await this.sendDiscordNotification({
      userId: order.buyer.discordId,
      guildId: order.server.discordServerId,
      type: 'SERIAL',
      productName: order.product.name,
      amount: order.amount,
      deliveryLink: `${this.frontendUrl}/delivery/${order.deliveryToken}`,
      reviewLink: `${this.frontendUrl}/review/${order.reviewToken}`,
    });

    this.logger.log(`✅ Serial livré pour ${order.id}`);
  }

  /**
   * Livrer un PDF
   */
  private async deliverPdf(order: any) {
    this.logger.log(`📄 Livraison de PDF pour ${order.id}`);

    if (!order.product.fileUrl) {
      throw new BadRequestException('Aucun fichier PDF configuré pour ce produit');
    }

    // Envoyer l'email
    await this.mailService.sendOrderConfirmation({
      orderId: order.id,
      buyerEmail: order.buyer.email || 'no-email@example.com',
      buyerUsername: order.buyer.username,
      productName: order.product.name,
      productType: 'PDF',
      amount: order.amount,
      shopName: order.server.shopName,
      reviewToken: order.reviewToken,
      fileUrl: order.product.fileUrl,
    });

    // Envoyer message Discord
    await this.sendDiscordNotification({
      userId: order.buyer.discordId,
      guildId: order.server.discordServerId,
      type: 'PDF',
      productName: order.product.name,
      amount: order.amount,
      downloadLink: `${this.frontendUrl}/api/uploads/${order.product.fileUrl}`,
      reviewLink: `${this.frontendUrl}/review/${order.reviewToken}`,
    });

    this.logger.log(`✅ PDF livré pour ${order.id}`);
  }

  /**
   * Livrer un ROLE Discord
   */
  private async deliverRole(order: any) {
    this.logger.log(`👑 Livraison de rôle Discord pour ${order.id}`);

    if (!order.product.discordRoleId) {
      throw new BadRequestException('Aucun rôle Discord configuré pour ce produit');
    }

    // Attribuer le rôle via le bot Discord
    try {
      await this.assignDiscordRole({
        guildId: order.server.discordServerId,
        userId: order.buyer.discordId,
        roleId: order.product.discordRoleId,
        duration: order.product.roleDuration, // null = permanent, >0 = temporaire
      });

      this.logger.log(`✅ Rôle Discord attribué pour ${order.id}`);
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'attribution du rôle:`, error);
      throw new BadRequestException('Impossible d\'attribuer le rôle Discord');
    }

    // Envoyer l'email
    await this.mailService.sendOrderConfirmation({
      orderId: order.id,
      buyerEmail: order.buyer.email || 'no-email@example.com',
      buyerUsername: order.buyer.username,
      productName: order.product.name,
      productType: 'ROLE',
      amount: order.amount,
      shopName: order.server.shopName,
      reviewToken: order.reviewToken,
      roleName: order.product.name,
    });

    // Envoyer message Discord
    const durationText = this.getRoleDurationText(
      order.product.roleDuration,
      order.product.roleAutoRenew,
    );

    await this.sendDiscordNotification({
      userId: order.buyer.discordId,
      guildId: order.server.discordServerId,
      type: 'ROLE',
      productName: order.product.name,
      amount: order.amount,
      roleName: order.product.name,
      roleDuration: durationText,
      roleAutoRenew: order.product.roleAutoRenew,
      reviewLink: `${this.frontendUrl}/review/${order.reviewToken}`,
    });

    this.logger.log(`✅ Rôle livré pour ${order.id}`);
  }

  /**
   * Attribuer un rôle Discord via le bot
   */
  private async assignDiscordRole(data: {
    guildId: string;
    userId: string;
    roleId: string;
    duration: number | null;
  }) {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.botApiUrl}/api/roles/assign`,
          data,
          {
            headers: {
              'X-Bot-Api-Key': this.botApiKey,
            },
          },
        ),
      );
    } catch (error) {
      this.logger.error('Erreur lors de l\'attribution du rôle:', error);
      throw error;
    }
  }

  /**
   * Envoyer une notification Discord à l'utilisateur
   */
  private async sendDiscordNotification(data: any) {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.botApiUrl}/api/notifications/delivery`,
          data,
          {
            headers: {
              'X-Bot-Api-Key': this.botApiKey,
            },
          },
        ),
      );
      this.logger.log(`✅ Notification Discord envoyée à ${data.userId}`);
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi de la notification Discord:', error);
      // Ne pas throw ici, la livraison a déjà réussi
    }
  }

  /**
   * Formater la durée du rôle en texte
   */
  private getRoleDurationText(duration: number | null, autoRenew: boolean): string {
    if (duration === null || duration === -1) {
      return 'Permanent (Lifetime)';
    }
    
    if (duration === 1) {
      return autoRenew ? '1 jour (renouvelé automatiquement)' : '1 jour';
    }
    
    if (duration === 7) {
      return autoRenew ? '7 jours (renouvelé automatiquement)' : '7 jours';
    }
    
    if (duration === 30) {
      return autoRenew ? '30 jours (renouvelé automatiquement)' : '30 jours';
    }
    
    return autoRenew ? `${duration} jours (renouvelé automatiquement)` : `${duration} jours`;
  }
}