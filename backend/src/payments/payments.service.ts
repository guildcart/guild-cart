import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private productsService: ProductsService,
    private ordersService: OrdersService,
    private prisma: PrismaService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2023-10-16',
      },
    );
  }

  async createPaymentIntent(productId: string, userId: string) {
    const product = await this.productsService.findOne(productId);

    // Vérifier le stock
    if (product.stock !== null && product.stock <= 0) {
      throw new Error('Product out of stock');
    }

    // Créer le Payment Intent Stripe
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(product.price * 100), // Convertir en centimes
      currency: 'eur',
      metadata: {
        productId: product.id,
        userId,
        serverId: product.serverId,
      },
    });

    // Créer l'order en BDD avec status PENDING
    await this.ordersService.create({
      serverId: product.serverId,
      buyerId: userId,
      productId: product.id,
      stripePaymentIntentId: paymentIntent.id,
      amount: product.price,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Gérer les différents événements
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const order = await this.ordersService.findByPaymentIntent(
      paymentIntent.id,
    );

    if (!order) {
      console.error('Order not found for payment intent:', paymentIntent.id);
      return;
    }

    // Mettre à jour le statut de la commande
    await this.ordersService.updateStatus(order.id, OrderStatus.COMPLETED);

    // Décrémenter le stock
    await this.productsService.decrementStock(order.productId);

    // Créer une transaction pour la commission
    await this.prisma.transaction.create({
      data: {
        serverId: order.serverId,
        orderId: order.id,
        type: 'SALE',
        amount: order.amount,
        commissionAmount: order.commissionAmount,
      },
    });

    console.log(`✅ Payment succeeded for order ${order.id}`);

    // TODO: Envoyer à la queue de livraison (Bot Discord)
    // Ici on ajoutera l'envoi à Bull Queue pour que le bot livre le produit
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const order = await this.ordersService.findByPaymentIntent(
      paymentIntent.id,
    );

    if (order) {
      await this.ordersService.updateStatus(order.id, OrderStatus.FAILED);
      console.log(`❌ Payment failed for order ${order.id}`);
    }
  }
}