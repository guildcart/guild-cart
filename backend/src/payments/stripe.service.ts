// backend/src/payments/stripe.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
  private stripeClients: Map<string, Stripe> = new Map();

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Obtenir le client Stripe pour un serveur spécifique
   * Utilise les clés Stripe du serveur ou les clés globales en fallback
   */
  private async getStripeClient(serverId: string): Promise<Stripe> {
    // Vérifier si on a déjà un client en cache
    if (this.stripeClients.has(serverId)) {
      return this.stripeClients.get(serverId)!;
    }

    // Récupérer les clés Stripe du serveur
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      select: { stripeSecretKey: true },
    });

    let secretKey = server?.stripeSecretKey;

    // Fallback sur la clé globale si le serveur n'a pas configuré Stripe
    if (!secretKey) {
      secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (!secretKey) {
        throw new BadRequestException(
          'Stripe n\'est pas configuré pour ce serveur. Veuillez ajouter vos clés Stripe dans les paramètres.',
        );
      }
    }

    // Créer le client Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });

    // Mettre en cache
    this.stripeClients.set(serverId, stripe);

    return stripe;
  }

  /**
   * Créer un Payment Intent pour un achat unique
   * Utilisé pour : PDF, SERIAL, ROLE Lifetime, ROLE Temporaire sans renouvellement
   */
  async createPaymentIntent(data: {
    serverId: string;
    userId: string;
    productId: string;
    amount: number; // en centimes (ex: 999 = 9.99€)
    currency?: string;
  }) {
    const stripe = await this.getStripeClient(data.serverId);

    // Récupérer les infos du produit et du serveur
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
      include: { server: true },
    });

    if (!product) {
      throw new BadRequestException('Produit introuvable');
    }

    // Créer le Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency || 'eur',
      metadata: {
        serverId: data.serverId,
        userId: data.userId,
        productId: data.productId,
        productName: product.name,
        productType: product.type,
        shopName: product.server.shopName,
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // 🆕 Désactiver les redirections pour simplifier les tests
      },
    });

    return paymentIntent;
  }

  /**
   * Créer une Subscription pour un abonnement récurrent
   * Utilisé pour : ROLE Temporaire avec renouvellement automatique
   */
  async createSubscription(data: {
    serverId: string;
    userId: string;
    productId: string;
    amount: number; // en centimes
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount?: number; // ex: 30 jours = interval: 'day', intervalCount: 30
    currency?: string;
    customerEmail?: string;
  }) {
    const stripe = await this.getStripeClient(data.serverId);

    // Récupérer les infos du produit
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
      include: { server: true },
    });

    if (!product) {
      throw new BadRequestException('Produit introuvable');
    }

    // Vérifier que le produit supporte les abonnements
    if (product.type !== 'ROLE' || !product.roleAutoRenew) {
      throw new BadRequestException(
        'Ce produit ne supporte pas les abonnements',
      );
    }

    // Créer ou récupérer le customer Stripe
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    // Chercher un customer existant ou en créer un nouveau
    let customerId: string;
    const existingCustomers = await stripe.customers.list({
      email: data.customerEmail || user.email || undefined,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: data.customerEmail || user.email || undefined,
        metadata: {
          userId: user.id,
          discordId: user.discordId,
          username: user.username,
        },
      });
      customerId = customer.id;
    }

    // Créer le prix (price)
    const price = await stripe.prices.create({
      unit_amount: data.amount,
      currency: data.currency || 'eur',
      recurring: {
        interval: data.interval,
        interval_count: data.intervalCount || 1,
      },
      product_data: {
        name: product.name,
        metadata: {
          productId: product.id,
          serverId: data.serverId,
        },
      },
    });

    // Créer la subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      metadata: {
        serverId: data.serverId,
        userId: data.userId,
        productId: data.productId,
        productName: product.name,
        shopName: product.server.shopName,
      },
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  }

  /**
   * Annuler une subscription
   */
  async cancelSubscription(serverId: string, subscriptionId: string) {
    const stripe = await this.getStripeClient(serverId);
    return stripe.subscriptions.cancel(subscriptionId);
  }

  /**
   * Récupérer une subscription
   */
  async getSubscription(serverId: string, subscriptionId: string) {
    const stripe = await this.getStripeClient(serverId);
    return stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Créer un lien de mise à jour de moyen de paiement
   * Utilisé pendant la grace period quand un paiement échoue
   */
  async createPaymentMethodUpdateLink(
    serverId: string,
    customerId: string,
  ): Promise<string> {
    const stripe = await this.getStripeClient(serverId);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${this.configService.get('FRONTEND_URL')}/success`,
    });

    return session.url;
  }

  /**
   * Vérifier la signature d'un webhook Stripe
   */
  verifyWebhookSignature(
    payload: Buffer,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    const stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
      { apiVersion: '2023-10-16' },
    );

    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${err.message}`,
      );
    }
  }

  /**
   * Calculer le montant de commission
   */
  calculateCommission(amount: number, commissionRate: number): number {
    return Math.round(amount * (commissionRate / 100));
  }
}