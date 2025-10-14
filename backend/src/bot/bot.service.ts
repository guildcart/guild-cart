import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionTier } from '@prisma/client';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Crée automatiquement l'utilisateur (owner) et le serveur dans la BDD
   * Appelé quand le bot est ajouté à un nouveau serveur Discord
   */
  async handleGuildCreate(data: {
    guildId: string;
    guildName: string;
    ownerId: string;
    ownerUsername: string;
    ownerAvatar?: string;
  }) {
    this.logger.log(`Création automatique du serveur: ${data.guildName} (${data.guildId})`);

    try {
      // 1️⃣ Créer ou récupérer l'utilisateur (owner)
      let user = await this.prisma.user.findUnique({
        where: { discordId: data.ownerId },
      });

      if (!user) {
        this.logger.log(`Création de l'utilisateur: ${data.ownerUsername} (${data.ownerId})`);
        user = await this.prisma.user.create({
          data: {
            discordId: data.ownerId,
            username: data.ownerUsername,
            avatar: data.ownerAvatar,
          },
        });
      }

      // 2️⃣ Vérifier si le serveur existe déjà
      const existingServer = await this.prisma.server.findUnique({
        where: { discordServerId: data.guildId },
      });

      if (existingServer) {
        this.logger.warn(`Le serveur ${data.guildName} existe déjà dans la BDD`);
        return {
          message: 'Server already exists',
          server: existingServer,
        };
      }

      // 3️⃣ Créer le serveur
      const server = await this.prisma.server.create({
        data: {
          discordServerId: data.guildId,
          shopName: `${data.guildName} Shop`,
          description: `Boutique officielle du serveur ${data.guildName}`,
          ownerId: user.id,
          subscriptionTier: SubscriptionTier.FREE,
          commissionRate: 5.0, // 5% pour le plan gratuit
          active: true,
        },
        include: {
          owner: {
            select: {
              username: true,
              discordId: true,
            },
          },
        },
      });

      this.logger.log(`✅ Serveur créé avec succès: ${server.shopName} (ID: ${server.id})`);

      return {
        message: 'Server created successfully',
        server,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la création du serveur:', error);
      throw error;
    }
  }
}