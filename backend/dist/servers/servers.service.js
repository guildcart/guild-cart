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
exports.ServersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ServersService = class ServersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const existing = await this.prisma.server.findUnique({
            where: { discordServerId: data.discordServerId },
        });
        if (existing) {
            throw new Error('Server already registered');
        }
        return this.prisma.server.create({
            data: {
                ...data,
                subscriptionTier: client_1.SubscriptionTier.FREE,
                commissionRate: 5.0,
            },
        });
    }
    async findOne(id) {
        const server = await this.prisma.server.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        username: true,
                        discordId: true,
                    },
                },
                _count: {
                    select: {
                        products: true,
                        orders: true,
                    },
                },
            },
        });
        if (!server) {
            throw new common_1.NotFoundException('Server not found');
        }
        return server;
    }
    async findByDiscordId(discordServerId) {
        return this.prisma.server.findUnique({
            where: { discordServerId },
            include: {
                owner: true,
            },
        });
    }
    async update(id, userId, data) {
        const server = await this.findOne(id);
        if (server.ownerId !== userId) {
            throw new common_1.ForbiddenException('You do not own this server');
        }
        return this.prisma.server.update({
            where: { id },
            data,
        });
    }
    async updateSubscription(id, tier, stripeSubscriptionId) {
        const commissionRates = {
            FREE: 5.0,
            STARTER: 3.5,
            PRO: 2.0,
            BUSINESS: 1.0,
            ENTERPRISE: 0.5,
        };
        return this.prisma.server.update({
            where: { id },
            data: {
                subscriptionTier: tier,
                commissionRate: commissionRates[tier],
                stripeSubscriptionId,
                subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
    }
    async getStats(serverId) {
        const server = await this.findOne(serverId);
        const orders = await this.prisma.order.findMany({
            where: { serverId },
        });
        const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
        const totalCommissions = orders.reduce((sum, order) => sum + order.commissionAmount, 0);
        return {
            server,
            stats: {
                totalOrders: orders.length,
                totalRevenue,
                totalCommissions,
                netRevenue: totalRevenue - totalCommissions,
            },
        };
    }
};
exports.ServersService = ServersService;
exports.ServersService = ServersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServersService);
//# sourceMappingURL=servers.service.js.map