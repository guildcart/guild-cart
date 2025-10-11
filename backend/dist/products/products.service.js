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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(serverId, userId, data) {
        const server = await this.prisma.server.findUnique({
            where: { id: serverId },
        });
        if (!server || server.ownerId !== userId) {
            throw new common_1.ForbiddenException('You do not own this server');
        }
        return this.prisma.product.create({
            data: {
                ...data,
                serverId,
            },
        });
    }
    async findAll(serverId, activeOnly = true) {
        return this.prisma.product.findMany({
            where: {
                serverId,
                ...(activeOnly && { active: true }),
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                server: {
                    select: {
                        shopName: true,
                        discordServerId: true,
                    },
                },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        return product;
    }
    async update(id, userId, data) {
        const product = await this.findOne(id);
        const server = await this.prisma.server.findUnique({
            where: { id: product.serverId },
        });
        if (!server || server.ownerId !== userId) {
            throw new common_1.ForbiddenException('You do not own this server');
        }
        return this.prisma.product.update({
            where: { id },
            data,
        });
    }
    async delete(id, userId) {
        const product = await this.findOne(id);
        const server = await this.prisma.server.findUnique({
            where: { id: product.serverId },
        });
        if (!server || server.ownerId !== userId) {
            throw new common_1.ForbiddenException('You do not own this server');
        }
        return this.prisma.product.delete({
            where: { id },
        });
    }
    async decrementStock(id) {
        const product = await this.findOne(id);
        if (product.stock !== null && product.stock <= 0) {
            throw new Error('Product out of stock');
        }
        if (product.stock !== null) {
            return this.prisma.product.update({
                where: { id },
                data: {
                    stock: { decrement: 1 },
                    salesCount: { increment: 1 },
                },
            });
        }
        return this.prisma.product.update({
            where: { id },
            data: {
                salesCount: { increment: 1 },
            },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map