// backend/src/products/products.service.ts - VERSION COMPLÈTE

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(
    serverId: string,
    userId: string,
    data: {
      name: string;
      description: string;
      price: number;
      type: ProductType;
      fileUrl?: string;
      discordRoleId?: string;
      serialCredentials?: string;
      bonusRoleId?: string;
      stock?: number;
      // Abonnement rôles
      roleDuration?: number;
      roleAutoRenew?: boolean;
      roleRequiresSubscription?: boolean;
      roleGracePeriodDays?: number;
    },
  ) {
    // Vérifier que l'utilisateur est propriétaire du serveur
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server || server.ownerId !== userId) {
      throw new ForbiddenException('You do not own this server');
    }

    // ✅ VALIDATION : Abonnement rôles
    if (data.type === 'ROLE' && data.roleDuration !== undefined) {
      // Si Lifetime (-1), pas de renouvellement auto
      if (data.roleDuration === -1) {
        if (data.roleAutoRenew) {
          throw new BadRequestException(
            'Les rôles Lifetime ne peuvent pas avoir de renouvellement automatique',
          );
        }
        if (data.roleRequiresSubscription) {
          throw new BadRequestException(
            'Les rôles Lifetime ne peuvent pas forcer l\'abonnement',
          );
        }
      }
      
      // Si renouvellement requis sans renouvellement auto, erreur
      if (data.roleRequiresSubscription && !data.roleAutoRenew) {
        throw new BadRequestException(
          'Si vous forcez l\'abonnement, le renouvellement automatique doit être activé',
        );
      }

      // Si renouvellement auto mais pas de durée, erreur
      if (data.roleAutoRenew && (!data.roleDuration || data.roleDuration <= 0)) {
        throw new BadRequestException(
          'Le renouvellement automatique nécessite une durée de rôle définie (> 0 jours)',
        );
      }

      // Si durée temporaire invalide
      if (data.roleDuration && data.roleDuration !== -1 && data.roleDuration <= 0) {
        throw new BadRequestException(
          'La durée du rôle doit être supérieure à 0 jours, ou -1 pour Lifetime',
        );
      }

      // Validation grace period
      if (data.roleGracePeriodDays !== undefined) {
        if (!data.roleAutoRenew) {
          throw new BadRequestException(
            'La période de grâce nécessite le renouvellement automatique',
          );
        }
        if (data.roleGracePeriodDays < 1 || data.roleGracePeriodDays > 30) {
          throw new BadRequestException(
            'La période de grâce doit être entre 1 et 30 jours',
          );
        }
      }
    }

    return this.prisma.product.create({
      data: {
        ...data,
        serverId,
      },
    });
  }

  async findAll(serverId: string, activeOnly = true) {
    return this.prisma.product.findMany({
      where: {
        serverId,
        ...(activeOnly && { active: true }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        server: {
          select: {
            shopName: true,
            discordServerId: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      fileUrl: string;
      discordRoleId: string;
      serialCredentials: string;
      bonusRoleId: string;
      stock: number;
      active: boolean;
      // Abonnement rôles
      roleDuration: number;
      roleAutoRenew: boolean;
      roleRequiresSubscription: boolean;
      roleGracePeriodDays: number;
    }>,
  ) {
    // Vérifier que l'utilisateur est propriétaire du serveur
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { server: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.server.ownerId !== userId) {
      throw new ForbiddenException('You do not own this server');
    }

    // ✅ VALIDATION : Si on modifie les paramètres d'abonnement
    if (product.type === 'ROLE') {
      const newRoleRequiresSubscription = data.roleRequiresSubscription ?? product.roleRequiresSubscription;
      const newRoleAutoRenew = data.roleAutoRenew ?? product.roleAutoRenew;
      const newRoleDuration = data.roleDuration ?? product.roleDuration;

      // Validation Lifetime
      if (newRoleDuration === -1) {
        if (newRoleAutoRenew) {
          throw new BadRequestException(
            'Les rôles Lifetime ne peuvent pas avoir de renouvellement automatique',
          );
        }
        if (newRoleRequiresSubscription) {
          throw new BadRequestException(
            'Les rôles Lifetime ne peuvent pas forcer l\'abonnement',
          );
        }
      }

      if (newRoleRequiresSubscription && !newRoleAutoRenew) {
        throw new BadRequestException(
          'Si vous forcez l\'abonnement, le renouvellement automatique doit être activé',
        );
      }

      if (newRoleAutoRenew && (!newRoleDuration || newRoleDuration <= 0)) {
        throw new BadRequestException(
          'Le renouvellement automatique nécessite une durée de rôle définie',
        );
      }

      if (data.roleDuration !== undefined && data.roleDuration !== -1 && data.roleDuration <= 0) {
        throw new BadRequestException(
          'La durée du rôle doit être supérieure à 0 jours ou -1 pour Lifetime',
        );
      }

      // Validation grace period
      if (data.roleGracePeriodDays !== undefined) {
        if (!newRoleAutoRenew) {
          throw new BadRequestException(
            'La période de grâce nécessite le renouvellement automatique',
          );
        }
        if (data.roleGracePeriodDays < 1 || data.roleGracePeriodDays > 30) {
          throw new BadRequestException(
            'La période de grâce doit être entre 1 et 30 jours',
          );
        }
      }
    }

    // Si on change le fichier, supprimer l'ancien
    if (data.fileUrl && product.fileUrl && product.fileUrl !== data.fileUrl) {
      try {
        const oldFilePath = path.join(
          __dirname,
          '..',
          '..',
          'uploads',
          path.basename(product.fileUrl),
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'ancien fichier:', error);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    // Vérifier que l'utilisateur est propriétaire du serveur
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { server: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.server.ownerId !== userId) {
      throw new ForbiddenException('You do not own this server');
    }

    // Supprimer le fichier si c'est un PDF
    if (product.type === 'PDF' && product.fileUrl) {
      try {
        const filePath = path.join(
          __dirname,
          '..',
          '..',
          'uploads',
          path.basename(product.fileUrl),
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du fichier:', error);
      }
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }

  // 🆕 Méthode pour vérifier les rôles expirés (cron job)
  async checkExpiredRoles() {
    const now = new Date();

    // Trouver tous les abonnements de rôles expirés
    const expiredSubscriptions = await this.prisma.roleSubscription.findMany({
      where: {
        currentPeriodEnd: {
          lte: now,
        },
        status: 'ACTIVE',
      },
      include: {
        product: true,
        user: true,
        server: true,
      },
    });

    console.log(`🔍 ${expiredSubscriptions.length} abonnements de rôles expirés trouvés`);

    // Pour chaque abonnement expiré
    for (const subscription of expiredSubscriptions) {
      // Si le produit a le renouvellement auto, Stripe gère ça via webhooks
      // Sinon, on retire le rôle
      if (!subscription.product.roleAutoRenew) {
        console.log(`⏱️ Rôle expiré pour ${subscription.user.username} - Retrait du rôle`);
        
        // TODO: Implémenter le retrait du rôle Discord via le bot
        // await removeDiscordRole(subscription.server.discordServerId, subscription.user.discordId, subscription.product.discordRoleId);

        // Marquer l'abonnement comme expiré
        await this.prisma.roleSubscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' },
        });
      }
    }

    return {
      checked: expiredSubscriptions.length,
      expired: expiredSubscriptions.filter(s => !s.product.roleAutoRenew).length,
    };
  }

  // 🆕 Créer un abonnement de rôle (appelé après paiement)
  async createRoleSubscription(
    userId: string,
    productId: string,
    serverId: string,
    stripeSubscriptionId?: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.type !== 'ROLE') {
      throw new BadRequestException('Product is not a role');
    }

    if (!product.roleDuration || product.roleDuration <= 0) {
      throw new BadRequestException('Product does not have a valid duration');
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + product.roleDuration);

    return this.prisma.roleSubscription.create({
      data: {
        userId,
        productId,
        serverId,
        stripeSubscriptionId,
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        status: 'ACTIVE',
      },
    });
  }

  // 🆕 Mettre à jour un abonnement de rôle (renouvellement)
  async renewRoleSubscription(subscriptionId: string) {
    const subscription = await this.prisma.roleSubscription.findUnique({
      where: { id: subscriptionId },
      include: { product: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (subscription.product.roleDuration || 30));

    return this.prisma.roleSubscription.update({
      where: { id: subscriptionId },
      data: {
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        retryCount: 0,
        lastRetryAt: null,
        status: 'ACTIVE',
      },
    });
  }

  // 🆕 Annuler un abonnement de rôle
  async cancelRoleSubscription(subscriptionId: string) {
    return this.prisma.roleSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELED' },
    });
  }

  // 🆕 Décrémenter le stock d'un produit (appelé après achat)
  async decrementStock(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Si le produit n'a pas de stock défini (null = illimité), ne rien faire
    if (product.stock === null) {
      return product;
    }

    // Si le stock est déjà à 0, désactiver le produit
    if (product.stock <= 0) {
      return this.prisma.product.update({
        where: { id: productId },
        data: { 
          active: false,
          stock: 0,
        },
      });
    }

    // Décrémenter le stock
    const newStock = product.stock - 1;
    
    return this.prisma.product.update({
      where: { id: productId },
      data: { 
        stock: newStock,
        salesCount: product.salesCount + 1,
        // Si le stock atteint 0, désactiver le produit
        active: newStock > 0 ? product.active : false,
      },
    });
  }

  // 🆕 Incrémenter le stock d'un produit (appelé après remboursement)
  async incrementStock(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Si le produit n'a pas de stock défini (null = illimité), ne rien faire
    if (product.stock === null) {
      return product;
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { 
        stock: product.stock + 1,
        salesCount: Math.max(0, product.salesCount - 1),
        // Si le produit était désactivé à cause du stock, le réactiver
        active: true,
      },
    });
  }
}