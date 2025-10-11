import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async create(data: {
    serverId: string;
    buyerId: string;
    productId: string;
    stripePaymentIntentId: string;
    amount: number;
  }) {
    const product = await this.productsService.findOne(data.productId);
    const server = await this.prisma.server.findUnique({
      where: { id: data.serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    // Calculer la commission
    const commissionAmount = data.amount * (server.commissionRate / 100);

    return this.prisma.order.create({
      data: {
        ...data,
        commissionAmount,
        status: OrderStatus.PENDING,
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

  async findOne(id: string) {
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
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findByPaymentIntent(stripePaymentIntentId: string) {
    return this.prisma.order.findUnique({
      where: { stripePaymentIntentId },
      include: {
        product: true,
        buyer: true,
        server: true,
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async markAsDelivered(id: string, deliveryData?: string) {
    return this.prisma.order.update({
      where: { id },
      data: {
        delivered: true,
        deliveredAt: new Date(),
        deliveryData,
      },
    });
  }

  async getServerOrders(serverId: string) {
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

  async getUserOrders(buyerId: string) {
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
}