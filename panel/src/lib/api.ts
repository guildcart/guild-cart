import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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

export const authApi = {
  getMe: () => api.get('/auth/me'),
};

export const serversApi = {
  getMyServers: () => api.get('/users/my-servers'),
  getServer: (id: string) => api.get(`/servers/${id}`),
  getStats: (id: string) => api.get(`/servers/${id}/stats`),
};

export const productsApi = {
  getServerProducts: (serverId: string) => api.get(`/products/server/${serverId}`),
  getProduct: (id: string) => api.get(`/products/${id}`),
  createProduct: (serverId: string, data: any) => 
    api.post(`/products/server/${serverId}`, data),
  updateProduct: (id: string, data: any) => api.patch(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
};

export const ordersApi = {
  getMyOrders: () => api.get('/users/my-orders'),
  getServerOrders: (serverId: string) => api.get(`/orders/server/${serverId}`),
};

export default api;