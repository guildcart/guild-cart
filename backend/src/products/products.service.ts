import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductType } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(
    serverId: string,
    userId: string,
    data: {
      name: string;
      description: string;
      price: number;
      type: ProductType;
      fileUrl?: string;
      discordRoleId?: string;
      stock?: number;
    },
  ) {
    // Vérifier que l'utilisateur est propriétaire du serveur
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server || server.ownerId !== userId) {
      throw new ForbiddenException('You do not own this server');
    }

    return this.prisma.product.create({
      data: {
        ...data,
        serverId,
      },
    });
  }

  async findAll(serverId: string, activeOnly = true) {
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

  async findOne(id: string) {
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
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      fileUrl: string;
      discordRoleId: string;
      stock: number;
      active: boolean;
    }>,
  ) {
    const product = await this.findOne(id);
    const server = await this.prisma.server.findUnique({
      where: { id: product.serverId },
    });

    if (!server || server.ownerId !== userId) {
      throw new ForbiddenException('You do not own this server');
    }

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    const product = await this.findOne(id);
    const server = await this.prisma.server.findUnique({
      where: { id: product.serverId },
    });

    if (!server || server.ownerId !== userId) {
      throw new ForbiddenException('You do not own this server');
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }

  async decrementStock(id: string) {
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
}