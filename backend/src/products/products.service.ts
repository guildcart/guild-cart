import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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
      serialCredentials?: string;  // 🆕 RENOMMÉ (ancien: accountCredentials)
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

  // 🆕 MODIFIÉ : Supprimer l'ancien fichier si remplacé
  async update(
    id: string,
    userId: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      fileUrl: string;
      discordRoleId: string;
      serialCredentials: string;  // 🆕 RENOMMÉ (ancien: accountCredentials)
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

    // 🆕 Si c'est un PDF et que l'URL a changé, supprimer l'ancien fichier
    if (product.type === 'PDF' && data.fileUrl && product.fileUrl !== data.fileUrl) {
      try {
        const oldFileName = product.fileUrl.split('/uploads/').pop();
        if (oldFileName) {
          const oldFilePath = path.join(process.cwd(), 'uploads', oldFileName);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(`✅ Ancien fichier PDF supprimé: ${oldFilePath}`);
          }
        }
      } catch (error) {
        console.error('⚠️ Erreur suppression ancien fichier:', error);
        // On continue quand même la mise à jour
      }
    }

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  // 🆕 MODIFIÉ : Supprimer le fichier physique lors de la suppression
  async delete(id: string, userId: string) {
    const product = await this.findOne(id);
    const server = await this.prisma.server.findUnique({
      where: { id: product.serverId },
    });

    if (!server || server.ownerId !== userId) {
      throw new ForbiddenException('You do not own this server');
    }

    // Si c'est un produit PDF avec un fichier uploadé localement
    if (product.type === 'PDF' && product.fileUrl) {
      try {
        const fileName = product.fileUrl.split('/uploads/').pop();
        
        if (fileName) {
          const filePath = path.join(process.cwd(), 'uploads', fileName);
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ Fichier supprimé: ${filePath}`);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du fichier:', error);
        // On continue quand même la suppression du produit en BDD
      }
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