import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import {
  CreatePaymentIntentDto,
  CreateSubscriptionDto,
  CancelSubscriptionDto,
} from './dto/create-payment-intent.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private stripeService: StripeService,
  ) {}

  /**
   * Créer un Payment Intent pour un achat unique
   */
  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Créer un Payment Intent',
    description: 'Créer un Payment Intent Stripe pour acheter un produit (PDF, SERIAL, ROLE sans abonnement)',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment Intent créé avec succès',
    schema: {
      properties: {
        clientSecret: { type: 'string', example: 'pi_xxx_secret_xxx' },
        paymentIntentId: { type: 'string', example: 'pi_xxx' },
      },
    },
  })
  async createPaymentIntent(
    @Body() body: CreatePaymentIntentDto,
    @GetUser() user: any,
  ) {
    const product = await this.paymentsService.getProduct(body.productId);

    if (!product) {
      throw new BadRequestException('Produit introuvable');
    }

    if (!product.active) {
      throw new BadRequestException('Ce produit n\'est plus disponible');
    }

    if (product.stock !== null && product.stock <= 0) {
      throw new BadRequestException('Ce produit est en rupture de stock');
    }

    if (product.type === 'ROLE' && product.roleRequiresSubscription) {
      throw new BadRequestException(
        'Ce produit nécessite un abonnement. Utilisez /create-subscription',
      );
    }

    const paymentIntent = await this.stripeService.createPaymentIntent({
      serverId: body.serverId,
      userId: user.id,
      productId: body.productId,
      amount: Math.round(product.price * 100),
      currency: 'eur',
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Créer une Subscription pour un abonnement récurrent
   */
  @Post('create-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Créer une Subscription',
    description: 'Créer une Subscription Stripe pour un abonnement récurrent (ROLE avec renouvellement)',
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription créée avec succès',
    schema: {
      properties: {
        subscriptionId: { type: 'string', example: 'sub_xxx' },
        clientSecret: { type: 'string', example: 'pi_xxx_secret_xxx' },
        status: { type: 'string', example: 'incomplete' },
      },
    },
  })
  async createSubscription(
    @Body() body: CreateSubscriptionDto,
    @GetUser() user: any,
  ) {
    const product = await this.paymentsService.getProduct(body.productId);

    if (!product) {
      throw new BadRequestException('Produit introuvable');
    }

    if (!product.active) {
      throw new BadRequestException('Ce produit n\'est plus disponible');
    }

    if (
      product.type !== 'ROLE' ||
      !product.roleAutoRenew ||
      !product.roleDuration ||
      product.roleDuration <= 0
    ) {
      throw new BadRequestException(
        'Ce produit ne supporte pas les abonnements',
      );
    }

    let interval: 'day' | 'week' | 'month' | 'year' = 'month';
    let intervalCount = 1;

    if (product.roleDuration === 7) {
      interval = 'week';
      intervalCount = 1;
    } else if (product.roleDuration === 30) {
      interval = 'month';
      intervalCount = 1;
    } else if (product.roleDuration === 90) {
      interval = 'month';
      intervalCount = 3;
    } else if (product.roleDuration === 365) {
      interval = 'year';
      intervalCount = 1;
    } else {
      interval = 'day';
      intervalCount = product.roleDuration;
    }

    const subscription = await this.stripeService.createSubscription({
      serverId: body.serverId,
      userId: user.id,
      productId: body.productId,
      amount: Math.round(product.price * 100),
      interval,
      intervalCount,
      currency: 'eur',
      customerEmail: body.customerEmail || user.email,
    });

    const latestInvoice: any = subscription.latest_invoice;
    const paymentIntent: any = latestInvoice?.payment_intent;

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret,
      status: subscription.status,
    };
  }

  /**
   * Annuler une subscription
   */
  @Post('cancel-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Annuler un abonnement',
    description: 'Annuler une subscription Stripe active',
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnement annulé avec succès',
  })
  async cancelSubscription(
    @Body() body: CancelSubscriptionDto,
    @GetUser() user: any,
  ) {
    const roleSubscription = await this.paymentsService.getRoleSubscription(
      body.subscriptionId,
    );

    if (!roleSubscription || roleSubscription.userId !== user.id) {
      throw new BadRequestException('Abonnement introuvable');
    }

    await this.stripeService.cancelSubscription(
      body.serverId,
      body.subscriptionId,
    );

    await this.paymentsService.cancelRoleSubscription(roleSubscription.id);

    return { success: true, message: 'Abonnement annulé' };
  }

  /**
   * Webhook Stripe
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook Stripe',
    description: 'Endpoint pour recevoir les événements Stripe (non authentifié)',
  })
  async handleStripeWebhook(
    @Req() request: any,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Avec express.raw(), le rawBody est dans request.body (Buffer)
    const rawBody = request.body;
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      throw new BadRequestException('Invalid request body');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const event = this.stripeService.verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret,
    );

    await this.paymentsService.handleWebhook(event);

    return { received: true };
  }
}