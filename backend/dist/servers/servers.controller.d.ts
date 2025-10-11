import { ServersService } from './servers.service';
export declare class ServersController {
    private serversService;
    constructor(serversService: ServersService);
    create(req: any, body: {
        discordServerId: string;
        shopName: string;
        description?: string;
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
    update(id: string, req: any, body: Partial<{
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
    getStats(id: string): Promise<{
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
