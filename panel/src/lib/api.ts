import axios from 'axios';

// URL de l'API backend
const API_URL = 'http://localhost:3000/api';

// Configuration de l'instance axios
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authApi = {
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// ==================== SERVERS API ====================
export const serversApi = {
  // Récupérer les serveurs de l'utilisateur
  getMyServers: () => api.get('/users/my-servers'),
  
  // Récupérer un serveur spécifique
  getServer: (id: string) => api.get(`/servers/${id}`),
  
  // Récupérer les statistiques d'un serveur
  getStats: (id: string) => api.get(`/servers/${id}/stats`),
  
  // Mettre à jour les paramètres d'un serveur
  updateServer: (id: string, data: any) => api.patch(`/servers/${id}`, data),
};

// ==================== PRODUCTS API ====================
export const productsApi = {
  // ✅ CORRIGÉ : Récupérer TOUS les produits (actifs ET inactifs) pour le panel admin
  getServerProducts: (serverId: string) => 
    api.get(`/products/server/${serverId}?activeOnly=false`),
  
  // Récupérer un produit spécifique
  getProduct: (id: string) => api.get(`/products/${id}`),
  
  // Créer un nouveau produit
  createProduct: (serverId: string, data: any) => 
    api.post(`/products/server/${serverId}`, data),
  
  // Mettre à jour un produit
  updateProduct: (id: string, data: any) => 
    api.patch(`/products/${id}`, data),
  
  // Supprimer un produit
  deleteProduct: (id: string) => 
    api.delete(`/products/${id}`),
};

// ==================== ORDERS API ====================
export const ordersApi = {
  // Récupérer les commandes de l'utilisateur
  getMyOrders: () => api.get('/users/my-orders'),
  
  // Récupérer les commandes d'un serveur
  getServerOrders: (serverId: string) => api.get(`/orders/server/${serverId}`),
};

// ==================== DISCORD API ====================
export const discordApi = {
  // Récupérer les rôles Discord d'un serveur
  getGuildRoles: (guildId: string) => api.get(`/discord/${guildId}/roles`),
};

// ==================== UPLOAD API ====================
export const uploadApi = {
  // Upload un fichier
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;