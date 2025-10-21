// backend/src/reviews/reviews.service.ts

import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Créer un avis via le review token
   */
  async createReview(reviewToken: string, data: { rating: number; comment?: string }) {
    // Validation
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('La note doit être entre 1 et 5 étoiles');
    }

    // Trouver la commande via le reviewToken
    const order = await this.prisma.order.findUnique({
      where: { reviewToken },
      include: {
        review: true, // Vérifier si un avis existe déjà
        buyer: true,
        server: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Token d\'avis invalide ou expiré');
    }

    // Vérifier si un avis existe déjà
    if (order.review) {
      throw new BadRequestException('Vous avez déjà laissé un avis pour cette commande');
    }

    // Créer l'avis
    const review = await this.prisma.review.create({
      data: {
        orderId: order.id,
        serverId: order.serverId,
        userId: order.buyerId,
        rating: data.rating,
        comment: data.comment || null,
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    this.logger.log(`✅ Avis créé: ${review.id} - ${review.rating}⭐ pour ${order.server.shopName}`);

    return review;
  }

  /**
   * Récupérer tous les avis d'un serveur
   */
  async getServerReviews(serverId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { serverId },
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
        order: {
          select: {
            id: true,
            amount: true,
            createdAt: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculer les statistiques
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    return {
      reviews,
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
      },
    };
  }

  /**
   * Vérifier si un review token est valide et récupérer les infos
   */
  async getReviewInfo(reviewToken: string) {
    const order = await this.prisma.order.findUnique({
      where: { reviewToken },
      include: {
        review: true,
        product: {
          select: {
            name: true,
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
      throw new NotFoundException('Token d\'avis invalide');
    }

    return {
      orderId: order.id.slice(0, 8),
      productName: order.product.name,
      shopName: order.server.shopName,
      amount: order.amount,
      hasReview: !!order.review,
      existingReview: order.review,
    };
  }
}