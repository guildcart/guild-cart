// backend/src/servers/servers.service.ts - CORRIGÉ FINAL

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
    return this.prisma.server.create({
      data,
    });
  }

  async findOne(id: string) {
    const server = await this.prisma.server.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
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
    const server = await this.prisma.server.findUnique({
      where: { discordServerId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return server;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      shopName: string;
      description: string;
      primaryColor: string;
      stripePublicKey: string;
      stripeSecretKey: string;
      webhookUrl: string;
      notifyOnSale: boolean;
      active: boolean;
    }>,
  ) {
    // Vérifier que l'utilisateur est propriétaire du serveur
    const server = await this.prisma.server.findUnique({
      where: { id },
    });

    if (!server || server.ownerId !== userId) {
      throw new ForbiddenException('You do not own this server');
    }

    return this.prisma.server.update({
      where: { id },
      data: {
        ...(data.shopName && { shopName: data.shopName }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.primaryColor && { primaryColor: data.primaryColor }),
        ...(data.stripePublicKey !== undefined && { stripePublicKey: data.stripePublicKey }),
        ...(data.stripeSecretKey !== undefined && { stripeSecretKey: data.stripeSecretKey }),
        ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl }),
        ...(data.notifyOnSale !== undefined && { notifyOnSale: data.notifyOnSale }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });
  }

  async getStats(id: string) {
    const server = await this.prisma.server.findUnique({
      where: { id },
      include: {
        // ✅ CORRIGÉ : Charger TOUS les produits (pas de filtre active: true)
        products: true,
        orders: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    const totalRevenue = server.orders.reduce(
      (sum, order) => sum + order.amount,
      0,
    );

    const totalOrders = server.orders.length;

    // ✅ CORRIGÉ : Compter TOUS les produits (actifs + inactifs)
    const totalProducts = server.products.length;

    // ✅ CORRIGÉ : Filtrer ensuite pour avoir seulement les actifs
    const activeProducts = server.products.filter(
      (product) => product.active,
    ).length;

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      activeProducts,
    };
  }

  async updateSubscription(
    id: string,
    tier: SubscriptionTier,
    stripeSubscriptionId: string,
  ) {
    // Définir le taux de commission selon le plan
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
      },
    });
  }
}