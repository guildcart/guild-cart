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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const products_service_1 = require("../products/products.service");
const client_1 = require("@prisma/client");
let OrdersService = class OrdersService {
    constructor(prisma, productsService) {
        this.prisma = prisma;
        this.productsService = productsService;
    }
    async create(data) {
        const product = await this.productsService.findOne(data.productId);
        const server = await this.prisma.server.findUnique({
            where: { id: data.serverId },
        });
        if (!server) {
            throw new common_1.NotFoundException('Server not found');
        }
        const commissionAmount = data.amount * (server.commissionRate / 100);
        return this.prisma.order.create({
            data: {
                ...data,
                commissionAmount,
                status: client_1.OrderStatus.PENDING,
            },
            include: {
                product: true,
                buyer: true,
                server: {
                    select: {
                        shopName: true,
                    },
                },
            },
        });
    }
    async findOne(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                product: true,
                buyer: true,
                server: {
                    select: {
                        shopName: true,
                        discordServerId: true,
                    },
                },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        return order;
    }
    async findByPaymentIntent(stripePaymentIntentId) {
        return this.prisma.order.findUnique({
            where: { stripePaymentIntentId },
            include: {
                product: true,
                buyer: true,
                server: true,
            },
        });
    }
    async updateStatus(id, status) {
        return this.prisma.order.update({
            where: { id },
            data: { status },
        });
    }
    async markAsDelivered(id, deliveryData) {
        return this.prisma.order.update({
            where: { id },
            data: {
                delivered: true,
                deliveredAt: new Date(),
                deliveryData,
            },
        });
    }
    async getServerOrders(serverId) {
        return this.prisma.order.findMany({
            where: { serverId },
            include: {
                product: true,
                buyer: {
                    select: {
                        username: true,
                        discordId: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async getUserOrders(buyerId) {
        return this.prisma.order.findMany({
            where: { buyerId },
            include: {
                product: true,
                server: {
                    select: {
                        shopName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        products_service_1.ProductsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map