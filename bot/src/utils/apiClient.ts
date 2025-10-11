import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';
import * as dotenv from 'dotenv';

// Charger dotenv ici aussi pour être sûr
dotenv.config();

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.BACKEND_API_URL;
    
    if (!baseURL) {
      logger.error('❌ BACKEND_API_URL non définie dans .env');
      throw new Error('BACKEND_API_URL est requis');
    }

    logger.info(`🔗 API Client configuré sur: ${baseURL}`);

    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Bot-Api-Key': process.env.BACKEND_API_KEY || '',
      },
    });

    // Intercepteur pour logger les erreurs
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  // Récupérer les produits d'un serveur
  async getServerProducts(discordServerId: string) {
    try {
      const response = await this.client.get(`/products/server/${discordServerId}`);
      return response.data;
    } catch (error) {
      logger.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }
  }

  // Récupérer un produit spécifique
  async getProduct(productId: string) {
    try {
      const response = await this.client.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      logger.error('Erreur lors de la récupération du produit:', error);
      throw error;
    }
  }

  // Créer un Payment Intent
  async createPaymentIntent(productId: string, userId: string) {
    try {
      const response = await this.client.post('/payments/create-payment-intent', {
        productId,
        userId,
      });
      return response.data;
    } catch (error) {
      logger.error('Erreur lors de la création du Payment Intent:', error);
      throw error;
    }
  }

  // Récupérer les commandes d'un utilisateur
async getUserOrders(userId: string) {
  try {
    const response = await this.client.get(`/orders/user/${userId}`); // Changé ici
    return response.data;
  } catch (error) {
    logger.error('Erreur lors de la récupération des commandes:', error);
    throw error;
  }
}

  // Récupérer les informations d'un serveur
  async getServer(discordServerId: string) {
    try {
      const response = await this.client.get(`/servers/discord/${discordServerId}`);
      return response.data;
    } catch (error) {
      logger.error('Erreur lors de la récupération du serveur:', error);
      throw error;
    }
  }

  // Créer un serveur
  async createServer(data: {
    discordServerId: string;
    shopName: string;
    description?: string;
    ownerId: string;
  }) {
    try {
      const response = await this.client.post('/servers', data);
      return response.data;
    } catch (error) {
      logger.error('Erreur lors de la création du serveur:', error);
      throw error;
    }
  }

  // Marquer une commande comme livrée
  async markOrderAsDelivered(orderId: string, deliveryData?: string) {
    try {
      const response = await this.client.patch(`/orders/${orderId}/delivered`, {
        deliveryData,
      });
      return response.data;
    } catch (error) {
      logger.error('Erreur lors du marquage de la commande:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();