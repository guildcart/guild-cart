import { OrdersService } from './orders.service';
export declare class OrdersController {
    private ordersService;
    constructor(ordersService: OrdersService);
    findOne(id: string): Promise<{
        server: {
            discordServerId: string;
            shopName: string;
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
        product: {
            id: string;
            serverId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            active: boolean;
            name: string;
            price: number;
            type: import(".prisma/client").$Enums.ProductType;
            fileUrl: string | null;
            discordRoleId: string | null;
            stock: number | null;
            salesCount: number;
        };
    } & {
        id: string;
        stripePaymentIntentId: string;
        serverId: string;
        buyerId: string;
        productId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        amount: number;
        commissionAmount: number;
        deliveryData: string | null;
        delivered: boolean;
        deliveredAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getServerOrders(serverId: string): Promise<({
        buyer: {
            discordId: string;
            username: string;
        };
        product: {
            id: string;
            serverId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            active: boolean;
            name: string;
            price: number;
            type: import(".prisma/client").$Enums.ProductType;
            fileUrl: string | null;
            discordRoleId: string | null;
            stock: number | null;
            salesCount: number;
        };
    } & {
        id: string;
        stripePaymentIntentId: string;
        serverId: string;
        buyerId: string;
        productId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        amount: number;
        commissionAmount: number;
        deliveryData: string | null;
        delivered: boolean;
        deliveredAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getMyOrders(req: any): Promise<({
        server: {
            shopName: string;
        };
        product: {
            id: string;
            serverId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            active: boolean;
            name: string;
            price: number;
            type: import(".prisma/client").$Enums.ProductType;
            fileUrl: string | null;
            discordRoleId: string | null;
            stock: number | null;
            salesCount: number;
        };
    } & {
        id: string;
        stripePaymentIntentId: string;
        serverId: string;
        buyerId: string;
        productId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        amount: number;
        commissionAmount: number;
        deliveryData: string | null;
        delivered: boolean;
        deliveredAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getUserOrdersByUserId(userId: string): Promise<({
        server: {
            shopName: string;
        };
        product: {
            id: string;
            serverId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            active: boolean;
            name: string;
            price: number;
            type: import(".prisma/client").$Enums.ProductType;
            fileUrl: string | null;
            discordRoleId: string | null;
            stock: number | null;
            salesCount: number;
        };
    } & {
        id: string;
        stripePaymentIntentId: string;
        serverId: string;
        buyerId: string;
        productId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        amount: number;
        commissionAmount: number;
        deliveryData: string | null;
        delivered: boolean;
        deliveredAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
}
