import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    discordId: string;
    username: string;
    email?: string;
    avatar?: string;
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByDiscordId(discordId: string) {
    return this.prisma.user.findUnique({
      where: { discordId },
    });
  }

  async update(id: string, data: Partial<{
    username: string;
    email: string;
    avatar: string;
  }>) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async getOwnedServers(userId: string) {
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

  async getOrders(userId: string) {
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
}