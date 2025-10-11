import { PrismaService } from '../prisma/prisma.service';
import { ProductType } from '@prisma/client';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(serverId: string, userId: string, data: {
        name: string;
        description: string;
        price: number;
        type: ProductType;
        fileUrl?: string;
        discordRoleId?: string;
        stock?: number;
    }): Promise<{
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
    }>;
    findAll(serverId: string, activeOnly?: boolean): Promise<{
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
    }[]>;
    findOne(id: string): Promise<{
        server: {
            discordServerId: string;
            shopName: string;
        };
    } & {
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
    }>;
    update(id: string, userId: string, data: Partial<{
        name: string;
        description: string;
        price: number;
        fileUrl: string;
        discordRoleId: string;
        stock: number;
        active: boolean;
    }>): Promise<{
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
    }>;
    delete(id: string, userId: string): Promise<{
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
    }>;
    decrementStock(id: string): Promise<{
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
    }>;
}
