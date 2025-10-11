import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { OrderStatus } from '@prisma/client';
export declare class OrdersService {
    private prisma;
    private productsService;
    constructor(prisma: PrismaService, productsService: ProductsService);
    create(data: {
        serverId: string;
        buyerId: string;
        productId: string;
        stripePaymentIntentId: string;
        amount: number;
    }): Promise<{
        server: {
            shopName: string;
        };
        product: {
            id: string;
            name: string;
            description: string;
            price: number;
            type: import(".prisma/client").$Enums.ProductType;
            fileUrl: string | null;
            discordRoleId: string | null;
            stock: number | null;
            salesCount: number;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            serverId: string;
        };
        buyer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            discordId: string;
            email: string | null;
            username: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serverId: string;
        stripePaymentIntentId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        amount: number;
        commissionAmount: number;
        deliveryData: string | null;
        delivered: boolean;
        deliveredAt: Date | null;
        buyerId: string;
        productId: string;
    }>;
    findOne(id: string): Promise<{
        server: {
            discordServerId: string;
            shopName: string;
        };
        product: {
            id: string;
            name: string;
            description: string;
            price: number;
            type: import(".prisma/client").$Enums.ProductType;
            fileUrl: string | null;
            discordRoleId: string | null;
            stock: number | null;
            salesCount: number;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            serverId: string;
        };
        buyer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            discordId: string;
            email: string | null;
            username: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serverId: string;
        stripePaymentIntentId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        amount: number;
        commissionAmount: number;
        deliveryData: string | null;
        delivered: boolean;
        deliveredAt: Date | null;
        buyerId: string;
        productId: string;
    }>;
    findByPaymentIntent(stripePaymentIntentId: string): Promise<{
        server: {
            id: string;
            description: string | null;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            discordServerId: string;
            shopName: string;
            ownerId: string;
            stripeAccountId: string | null;
            subscriptionTier: import(".prisma/client").$Enums.SubscriptionTier;
            subscriptionStatus: import(".prisma/client").$Enums.SubscriptionStatus;
            commissionRate: number;
            stripeSubscriptionId: string | null;
            subscriptionExpiresAt: Date | null;
        };
        product: {
            id: string;
            name: string;
            description: string;
            price: number;
            type: import(".prisma/client").$Enums.ProductType;
            fileUrl: string | null;
            discordRoleId: string | null;
            stock: number | null;
            salesCount: number;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            serverId: string;
        };
        buyer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            discordId: string;
            email: string | null;
            username: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serverId: string;
        stripePaymentIntentId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        amount: number;
        commissionAmount: number;
        deliveryData: string | null;
        delivered: boolean;
        deliveredAt: Date | null;
        buyerId: string;
        productId: string;
    }>;
    updateStatus(id: string, status: OrderStatus): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serverId: string;
        stripePaymentIntentId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        amount: number;
        commissionAmount: number;
        deliveryData: string | null;
        delivered: boolean;
        deliveredAt: Date | null;
        buyerId: string;
        productId: string;
    }>;
    markAsDelivered(id: string, deliveryData?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serverId: string;
        stripePaymentIntentId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        amount: number;
        commissionAmount: number;
        deliveryData: string | null;
        delivered: boolean;
        deliveredAt: Date | null;
        buyerId: string;
        productId: string;
    }>;
    getServerOrders(serverId: string): Promise<({
        product: {
            id: string;
            name: string;
            description: string;
            price: number;
            type: import(".prisma/client").$Enums.ProductType;
            fileUrl: string | null;
            discordRoleId: string | null;
            stock: number | null;
            salesCount: number;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            serverId: string;
        };
        buyer: {
            discordId: string;
            username: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serverId: string;
        stripePaymentIntentId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        amount: number;
        commissionAmount: number;
        deliveryData: string | null;
        delivered: boolean;
        deliveredAt: Date | null;
        buyerId: string;
        productId: string;
    })[]>;
    getUserOrders(buyerId: string): Promise<({
        server: {
            shopName: string;
        };
        product: {
            id: string;
            name: string;
            description: string;
            price: number;
            type: import(".prisma/client").$Enums.ProductType;
            fileUrl: string | null;
            discordRoleId: string | null;
            stock: number | null;
            salesCount: number;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            serverId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serverId: string;
        stripePaymentIntentId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        amount: number;
        commissionAmount: number;
        deliveryData: string | null;
        delivered: boolean;
        deliveredAt: Date | null;
        buyerId: string;
        productId: string;
    })[]>;
}
