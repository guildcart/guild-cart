import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionTier } from '@prisma/client';

@Injectable()
export class ServersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    discordServerId: string;
    shopName: string;
    description?: string;
    ownerId: string;
  }) {
    // Vérifier si le serveur existe déjà
    const existing = await this.prisma.server.findUnique({
      where: { discordServerId: data.discordServerId },
    });

    if (existing) {
      throw new Error('Server already registered');
    }

    return this.prisma.server.create({
      data: {
        ...data,
        subscriptionTier: SubscriptionTier.FREE,
        commissionRate: 5.0, // 5% par défaut pour plan FREE
      },
    });
  }

  async findOne(id: string) {
    const server = await this.prisma.server.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            username: true,
            discordId: true,
          },
        },
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return server;
  }

  async findByDiscordId(discordServerId: string) {
    return this.prisma.server.findUnique({
      where: { discordServerId },
      include: {
        owner: true,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      shopName: string;
      description: string;
      active: boolean;
    }>,
  ) {
    const server = await this.findOne(id);

    if (server.ownerId !== userId) {
      throw new ForbiddenException('You do not own this server');
    }

    return this.prisma.server.update({
      where: { id },
      data,
    });
  }

  async updateSubscription(
    id: string,
    tier: SubscriptionTier,
    stripeSubscriptionId?: string,
  ) {
    // Définir le taux de commission selon le tier
    const commissionRates = {
      FREE: 5.0,
      STARTER: 3.5,
      PRO: 2.0,
      BUSINESS: 1.0,
      ENTERPRISE: 0.5,
    };

    return this.prisma.server.update({
      where: { id },
      data: {
        subscriptionTier: tier,
        commissionRate: commissionRates[tier],
        stripeSubscriptionId,
        subscriptionExpiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ), // 30 jours
      },
    });
  }

  async getStats(serverId: string) {
    const server = await this.findOne(serverId);

    const orders = await this.prisma.order.findMany({
      where: { serverId },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
    const totalCommissions = orders.reduce(
      (sum, order) => sum + order.commissionAmount,
      0,
    );

    return {
      server,
      stats: {
        totalOrders: orders.length,
        totalRevenue,
        totalCommissions,
        netRevenue: totalRevenue - totalCommissions,
      },
    };
  }
}