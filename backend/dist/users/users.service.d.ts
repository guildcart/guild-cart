import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        discordId: string;
        username: string;
        email?: string;
        avatar?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        email: string | null;
        username: string;
        avatar: string | null;
    }>;
    findById(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        email: string | null;
        username: string;
        avatar: string | null;
    }>;
    findByDiscordId(discordId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        email: string | null;
        username: string;
        avatar: string | null;
    }>;
    update(id: string, data: Partial<{
        username: string;
        email: string;
        avatar: string;
    }>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        email: string | null;
        username: string;
        avatar: string | null;
    }>;
    getOwnedServers(userId: string): Promise<({
        _count: {
            products: number;
            orders: number;
        };
    } & {
        id: string;
        discordServerId: string;
        shopName: string;
        description: string | null;
        stripeAccountId: string | null;
        subscriptionTier: import(".prisma/client").$Enums.SubscriptionTier;
        subscriptionStatus: import(".prisma/client").$Enums.SubscriptionStatus;
        commissionRate: number;
        stripeSubscriptionId: string | null;
        subscriptionExpiresAt: Date | null;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    })[]>;
    getOrders(userId: string): Promise<({
        server: {
            shopName: string;
        };
        product: {
            id: string;
            description: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            serverId: string;
            price: number;
            type: import(".prisma/client").$Enums.ProductType;
            fileUrl: string | null;
            discordRoleId: string | null;
            stock: number | null;
            salesCount: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serverId: string;
        buyerId: string;
        productId: string;
        stripePaymentIntentId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        amount: number;
        commissionAmount: number;
        deliveryData: string | null;
        delivered: boolean;
        deliveredAt: Date | null;
    })[]>;
}
