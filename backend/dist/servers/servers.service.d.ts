import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionTier } from '@prisma/client';
export declare class ServersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        discordServerId: string;
        shopName: string;
        description?: string;
        ownerId: string;
    }): Promise<{
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
    }>;
    findOne(id: string): Promise<{
        owner: {
            discordId: string;
            username: string;
        };
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
    }>;
    findByDiscordId(discordServerId: string): Promise<{
        owner: {
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
    }>;
    update(id: string, userId: string, data: Partial<{
        shopName: string;
        description: string;
        active: boolean;
    }>): Promise<{
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
    }>;
    updateSubscription(id: string, tier: SubscriptionTier, stripeSubscriptionId?: string): Promise<{
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
    }>;
    getStats(serverId: string): Promise<{
        server: {
            owner: {
                discordId: string;
                username: string;
            };
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
        };
        stats: {
            totalOrders: number;
            totalRevenue: number;
            totalCommissions: number;
            netRevenue: number;
        };
    }>;
}
