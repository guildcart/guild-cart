// backend/src/delivery/delivery.controller.ts

import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer les détails d'une livraison via le token
   * Endpoint public (pas besoin de JWT)
   */
  @Get(':token')
  @ApiOperation({
    summary: 'Afficher les détails de livraison',
    description: 'Récupérer les serials ou infos de livraison via le delivery token (endpoint public)',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de la livraison',
  })
  async getDelivery(@Param('token') token: string) {
    const order = await this.prisma.order.findUnique({
      where: { deliveryToken: token },
      include: {
        product: {
          select: {
            name: true,
            type: true,
            fileUrl: true,
          },
        },
        server: {
          select: {
            shopName: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Livraison introuvable ou token invalide');
    }

    // Parser les serials si c'est un produit SERIAL
    let serials: string[] = [];
    if (order.product.type === 'SERIAL' && order.deliveryData) {
      try {
        const data = JSON.parse(order.deliveryData);
        serials = data.serials || [];
      } catch (error) {
        // Ignore parsing errors
      }
    }

    return {
      orderId: order.id.slice(0, 8),
      productName: order.product.name,
      productType: order.product.type,
      shopName: order.server.shopName,
      amount: order.amount,
      deliveredAt: order.deliveredAt,
      // Données spécifiques au type
      serials: order.product.type === 'SERIAL' ? serials : undefined,
      fileUrl: order.product.type === 'PDF' ? order.product.fileUrl : undefined,
    };
  }
}