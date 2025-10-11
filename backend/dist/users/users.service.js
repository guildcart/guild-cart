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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.user.create({
            data,
        });
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
    async findByDiscordId(discordId) {
        return this.prisma.user.findUnique({
            where: { discordId },
        });
    }
    async update(id, data) {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }
    async getOwnedServers(userId) {
        return this.prisma.server.findMany({
            where: { ownerId: userId },
            include: {
                _count: {
                    select: {
                        products: true,
                        orders: true,
                    },
                },
            },
        });
    }
    async getOrders(userId) {
        return this.prisma.order.findMany({
            where: { buyerId: userId },
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
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map