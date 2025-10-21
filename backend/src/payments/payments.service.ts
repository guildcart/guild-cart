// backend/src/payments/payments.service.ts

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { DeliveryService } from '../delivery/delivery.service'; // 🆕
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
    private deliveryService: DeliveryService, // 🆕
  ) {}

  /**
   * Récupérer un produit
   */
  async getProduct(productId: string) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      include: { server: true },
    });
  }

  /**
   * Récupérer une RoleSubscription par stripeSubscriptionId
   */
  async getRoleSubscription(stripeSubscriptionId: string) {
    return this.prisma.roleSubscription.findUnique({
      where: { stripeSubscriptionId },
      include: { user: true, product: true, server: true },
    });
  }

  /**
   * Annuler une RoleSubscription
   */
  async cancelRoleSubscription(id: string) {
    return this.prisma.roleSubscription.update({
      where: { id },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true,
      },
    });
  }

  /**
   * Handler principal des webhooks Stripe
   */
  async handleWebhook(event: Stripe.Event) {
    this.logger.log(`Webhook reçu : ${event.type}`);

    try {
      switch (event.type) {
        // ✅ Paiement unique réussi (Payment Intent)
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        // ✅ Abonnement créé
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription,
          );
          break;

        // ✅ Paiement d'abonnement réussi (renouvellement)
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice,
          );
          break;

        // ❌ Paiement d'abonnement échoué
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice,
          );
          break;

        // ⚠️ Abonnement annulé
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        // ⚠️ Abonnement mis à jour
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        default:
          this.logger.log(`Type d'événement non géré : ${event.type}`);
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement du webhook ${event.type}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Gérer un paiement unique réussi
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    const metadata = paymentIntent.metadata;
    const { serverId, userId, productId } = metadata;

    if (!serverId || !userId || !productId) {
      this.logger.warn('Metadata manquante dans le Payment Intent');
      return;
    }

    // Vérifier si la commande existe déjà
    const existingOrder = await this.prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (existingOrder) {
      this.logger.log(`Commande déjà traitée: ${existingOrder.id}`);
      return;
    }

    // Récupérer le produit
    const product = await this.getProduct(productId);
    if (!product) {
      throw new BadRequestException('Produit introuvable');
    }

    // Calculer la commission
    const commissionAmount =
      (paymentIntent.amount / 100) * (product.server.commissionRate / 100);

    // Créer la commande
    const order = await this.prisma.order.create({
      data: {
        serverId,
        buyerId: userId,
        productId,
        stripePaymentIntentId: paymentIntent.id,
        status: 'COMPLETED',
        amount: paymentIntent.amount / 100,
        commissionAmount,
      },
    });

    this.logger.log(`✅ Commande créée: ${order.id}`);

    // Décrémenter le stock
    if (product.stock !== null && product.stock > 0) {
      await this.productsService.decrementStock(productId);
    }

    // 🆕 Déclencher la livraison automatique
    await this.triggerDelivery(order.id);

    // Si c'est un rôle temporaire sans abonnement, créer la RoleSubscription
    if (
      product.type === 'ROLE' &&
      product.roleDuration &&
      product.roleDuration > 0 &&
      !product.roleAutoRenew
    ) {
      await this.createRoleSubscription({
        userId,
        productId,
        serverId,
        durationType: 'single_payment',
      });
    }

    // Si c'est un rôle Lifetime, pas besoin de RoleSubscription
    if (product.type === 'ROLE' && product.roleDuration === -1) {
      this.logger.log(`💎 Rôle Lifetime - Pas de subscription créée`);
    }
  }

  /**
   * 🆕 Déclencher la livraison d'une commande
   */
  private async triggerDelivery(orderId: string) {
    try {
      this.logger.log(`📦 Démarrage de la livraison pour ${orderId}`);
      await this.deliveryService.deliverOrder(orderId);
      this.logger.log(`✅ Livraison terminée pour ${orderId}`);
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la livraison de ${orderId}:`, error);
      // Ne pas throw pour ne pas bloquer le webhook
      // La commande est créée, on pourra réessayer la livraison manuellement
    }
  }

  /**
   * Gérer la création d'un abonnement
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const metadata = subscription.metadata;
    const { serverId, userId, productId } = metadata;

    if (!serverId || !userId || !productId) {
      this.logger.warn('Metadata manquante dans la Subscription');
      return;
    }

    // Vérifier si la RoleSubscription existe déjà
    const existing = await this.prisma.roleSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (existing) {
      this.logger.log(
        `RoleSubscription déjà existante: ${existing.id}`,
      );
      return;
    }

    // Créer la RoleSubscription
    await this.createRoleSubscription({
      userId,
      productId,
      serverId,
      stripeSubscriptionId: subscription.id,
      durationType: 'subscription',
    });

    this.logger.log(
      `✅ Abonnement créé: ${subscription.id}`,
    );
  }

  /**
   * Gérer un paiement d'invoice réussi (renouvellement)
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    // Récupérer la RoleSubscription
    const roleSubscription = await this.getRoleSubscription(subscriptionId);
    if (!roleSubscription) {
      this.logger.warn(
        `RoleSubscription introuvable pour ${subscriptionId}`,
      );
      return;
    }

    // Renouveler la subscription (calculer nouvelle période)
    const product = roleSubscription.product;
    const now = new Date();
    const newEndDate = new Date(now);
    newEndDate.setDate(newEndDate.getDate() + (product.roleDuration || 30));

    await this.prisma.roleSubscription.update({
      where: { id: roleSubscription.id },
      data: {
        currentPeriodStart: now,
        currentPeriodEnd: newEndDate,
        status: 'ACTIVE',
        retryCount: 0,
        lastRetryAt: null,
      },
    });

    this.logger.log(
      `✅ Abonnement renouvelé: ${roleSubscription.id}`,
    );

    // TODO: Notifier l'utilisateur du renouvellement
  }

  /**
   * Gérer un paiement d'invoice échoué
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    // Récupérer la RoleSubscription
    const roleSubscription = await this.getRoleSubscription(subscriptionId);
    if (!roleSubscription) {
      this.logger.warn(
        `RoleSubscription introuvable pour ${subscriptionId}`,
      );
      return;
    }

    const product = roleSubscription.product;
    const gracePeriodDays = product.roleGracePeriodDays || 7;
    const newRetryCount = roleSubscription.retryCount + 1;

    // Si on a dépassé le nombre de tentatives, expirer l'abonnement
    if (newRetryCount >= gracePeriodDays) {
      await this.prisma.roleSubscription.update({
        where: { id: roleSubscription.id },
        data: {
          status: 'EXPIRED',
          retryCount: newRetryCount,
          lastRetryAt: new Date(),
        },
      });

      this.logger.warn(
        `❌ Abonnement expiré après ${newRetryCount} tentatives: ${roleSubscription.id}`,
      );

      // TODO: Retirer le rôle Discord
      // TODO: Notifier l'utilisateur que son abonnement est expiré
    } else {
      // Incrémenter le compteur de tentatives
      await this.prisma.roleSubscription.update({
        where: { id: roleSubscription.id },
        data: {
          status: 'PAST_DUE',
          retryCount: newRetryCount,
          lastRetryAt: new Date(),
        },
      });

      this.logger.warn(
        `⚠️ Paiement échoué (${newRetryCount}/${gracePeriodDays}): ${roleSubscription.id}`,
      );

      // TODO: Envoyer un DM Discord avec le lien de mise à jour du paiement
    }
  }

  /**
   * Gérer la suppression d'un abonnement
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const roleSubscription = await this.getRoleSubscription(subscription.id);
    if (!roleSubscription) return;

    await this.prisma.roleSubscription.update({
      where: { id: roleSubscription.id },
      data: { status: 'CANCELED' },
    });

    this.logger.log(
      `⚠️ Abonnement annulé: ${roleSubscription.id}`,
    );

    // TODO: Retirer le rôle Discord
  }

  /**
   * Gérer la mise à jour d'un abonnement
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const roleSubscription = await this.getRoleSubscription(subscription.id);
    if (!roleSubscription) return;

    // Mettre à jour le statut
    let status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' = 'ACTIVE';
    if (subscription.status === 'past_due') status = 'PAST_DUE';
    if (subscription.status === 'canceled') status = 'CANCELED';
    if (subscription.status === 'unpaid') status = 'EXPIRED';

    await this.prisma.roleSubscription.update({
      where: { id: roleSubscription.id },
      data: { status },
    });

    this.logger.log(
      `🔄 Abonnement mis à jour: ${roleSubscription.id} → ${status}`,
    );
  }

  /**
   * Créer une RoleSubscription
   */
  private async createRoleSubscription(data: {
    userId: string;
    productId: string;
    serverId: string;
    stripeSubscriptionId?: string;
    durationType: 'single_payment' | 'subscription';
  }) {
    const product = await this.getProduct(data.productId);
    if (!product || product.type !== 'ROLE') {
      throw new BadRequestException('Produit invalide pour une RoleSubscription');
    }

    const now = new Date();
    const endDate = new Date(now);
    const duration = product.roleDuration || 30;

    // Calculer la date de fin
    if (duration > 0) {
      endDate.setDate(endDate.getDate() + duration);
    }

    // Créer la RoleSubscription
    const roleSubscription = await this.prisma.roleSubscription.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        serverId: data.serverId,
        stripeSubscriptionId: data.stripeSubscriptionId || null,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false,
        retryCount: 0,
      },
    });

    this.logger.log(`✅ RoleSubscription créée: ${roleSubscription.id}`);
    return roleSubscription;
  }
}