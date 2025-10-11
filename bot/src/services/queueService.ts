import Queue from 'bull';
import Redis from 'ioredis';
import { Client } from 'discord.js';
import { logger } from '../utils/logger';
import { deliverProduct } from './deliveryService';

// Configuration Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Créer la queue de livraison
export const deliveryQueue = new Queue('product-delivery', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export async function initializeQueue(client: Client) {
  try {
    // Process les jobs de livraison
    deliveryQueue.process(async (job) => {
      const { orderId, userId, productId, productType, deliveryData } = job.data;

      logger.info(`📦 Traitement de la livraison pour la commande ${orderId}`);

      try {
        await deliverProduct(client, {
          orderId,
          userId,
          productId,
          productType,
          deliveryData,
        });

        logger.info(`✅ Livraison réussie pour la commande ${orderId}`);
        return { success: true };
      } catch (error) {
        logger.error(`❌ Erreur lors de la livraison de la commande ${orderId}:`, error);
        throw error;
      }
    });

    // Event listeners
    deliveryQueue.on('completed', (job) => {
      logger.info(`✅ Job ${job.id} terminé`);
    });

    deliveryQueue.on('failed', (job, err) => {
      logger.error(`❌ Job ${job?.id} échoué:`, err);
    });

    deliveryQueue.on('error', (error) => {
      logger.error('Queue error:', error);
    });

    logger.info('✅ Queue de livraison initialisée');
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation de la queue:', error);
    throw error;
  }
}

// Ajouter un job de livraison à la queue
export async function addDeliveryJob(data: {
  orderId: string;
  userId: string;
  productId: string;
  productType: string;
  deliveryData: any;
}) {
  try {
    const job = await deliveryQueue.add(data, {
      priority: 1,
    });

    logger.info(`📥 Job de livraison ajouté: ${job.id}`);
    return job;
  } catch (error) {
    logger.error('Erreur lors de l\'ajout du job:', error);
    throw error;
  }
}