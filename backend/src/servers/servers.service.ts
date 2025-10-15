// backend/src/servers/servers.service.ts - CORRIGÉ

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
        commissionRate: 5.0,
        primaryColor: '#7C3AED',
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
      primaryColor: string;
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

  // 🆕 CORRIGÉ : Ajout de activeProducts
  async getStats(id: string) {
    const server = await this.findOne(id);

    const totalRevenue = await this.prisma.order.aggregate({
      where: {
        serverId: id,
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    const totalOrders = await this.prisma.order.count({
      where: {
        serverId: id,
        status: 'COMPLETED',
      },
    });

    const totalProducts = await this.prisma.product.count({
      where: { serverId: id },
    });

    // 🆕 Compter les produits actifs
    const activeProducts = await this.prisma.product.count({
      where: { 
        serverId: id,
        active: true,
      },
    });

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      totalOrders,
      totalProducts,
      activeProducts,  // 🆕 Ajouté
      subscriptionTier: server.subscriptionTier,
      commissionRate: server.commissionRate,
    };
  }

  async updateSubscription(
    id: string,
    tier: SubscriptionTier,
    stripeSubscriptionId?: string,
  ) {
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
        subscriptionExpiresAt: tier === SubscriptionTier.FREE 
          ? null 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
}