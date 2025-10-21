// backend/src/reviews/reviews.controller.ts

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  /**
   * Récupérer les informations d'un review token (page publique)
   */
  @Get('info/:token')
  @ApiOperation({
    summary: 'Récupérer les infos d\'un review token',
    description: 'Endpoint public pour vérifier si le token est valide et afficher les infos de commande',
  })
  @ApiResponse({ status: 200, description: 'Informations du review' })
  async getReviewInfo(@Param('token') token: string) {
    return this.reviewsService.getReviewInfo(token);
  }

  /**
   * Soumettre un avis (page publique)
   */
  @Post(':token')
  @ApiOperation({
    summary: 'Laisser un avis',
    description: 'Endpoint public pour soumettre un avis via le review token',
  })
  @ApiResponse({ status: 201, description: 'Avis créé avec succès' })
  async createReview(
    @Param('token') token: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.reviewsService.createReview(token, body);
  }

  /**
   * Récupérer tous les avis d'un serveur (admin uniquement)
   */
  @Get('server/:serverId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer les avis d\'un serveur',
    description: 'Liste tous les avis avec statistiques (admin uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Liste des avis avec stats' })
  async getServerReviews(@Param('serverId') serverId: string) {
    return this.reviewsService.getServerReviews(serverId);
  }
}