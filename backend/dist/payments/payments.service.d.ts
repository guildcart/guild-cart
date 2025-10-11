import { ConfigService } from '@nestjs/config';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class PaymentsService {
    private configService;
    private productsService;
    private ordersService;
    private prisma;
    private stripe;
    constructor(configService: ConfigService, productsService: ProductsService, ordersService: OrdersService, prisma: PrismaService);
    createPaymentIntent(productId: string, userId: string): Promise<{
        clientSecret: string;
        paymentIntentId: string;
    }>;
    handleWebhook(signature: string, rawBody: Buffer): Promise<{
        received: boolean;
    }>;
    private handlePaymentSuccess;
    private handlePaymentFailed;
}
