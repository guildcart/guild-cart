"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = require("stripe");
const products_service_1 = require("../products/products.service");
const orders_service_1 = require("../orders/orders.service");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PaymentsService = class PaymentsService {
    constructor(configService, productsService, ordersService, prisma) {
        this.configService = configService;
        this.productsService = productsService;
        this.ordersService = ordersService;
        this.prisma = prisma;
        this.stripe = new stripe_1.default(this.configService.get('STRIPE_SECRET_KEY'), {
            apiVersion: '2023-10-16',
        });
    }
    async createPaymentIntent(productId, userId) {
        const product = await this.productsService.findOne(productId);
        if (product.stock !== null && product.stock <= 0) {
            throw new Error('Product out of stock');
        }
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(product.price * 100),
            currency: 'eur',
            metadata: {
                productId: product.id,
                userId,
                serverId: product.serverId,
            },
        });
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
    async handleWebhook(signature, rawBody) {
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        }
        catch (err) {
            throw new Error(`Webhook signature verification failed: ${err.message}`);
        }
        switch (event.type) {
            case 'payment_intent.succeeded':
                await this.handlePaymentSuccess(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await this.handlePaymentFailed(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        return { received: true };
    }
    async handlePaymentSuccess(paymentIntent) {
        const order = await this.ordersService.findByPaymentIntent(paymentIntent.id);
        if (!order) {
            console.error('Order not found for payment intent:', paymentIntent.id);
            return;
        }
        await this.ordersService.updateStatus(order.id, client_1.OrderStatus.COMPLETED);
        await this.productsService.decrementStock(order.productId);
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
    }
    async handlePaymentFailed(paymentIntent) {
        const order = await this.ordersService.findByPaymentIntent(paymentIntent.id);
        if (order) {
            await this.ordersService.updateStatus(order.id, client_1.OrderStatus.FAILED);
            console.log(`❌ Payment failed for order ${order.id}`);
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        products_service_1.ProductsService,
        orders_service_1.OrdersService,
        prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map