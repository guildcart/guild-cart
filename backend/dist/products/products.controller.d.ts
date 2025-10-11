import { ProductsService } from './products.service';
import { ProductType } from '@prisma/client';
export declare class ProductsController {
    private productsService;
    constructor(productsService: ProductsService);
    create(serverId: string, req: any, body: {
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
    findAll(serverId: string, activeOnly?: string): Promise<{
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
    update(id: string, req: any, body: Partial<{
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
    delete(id: string, req: any): Promise<{
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
