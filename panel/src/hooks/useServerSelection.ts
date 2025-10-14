import { useState, useEffect } from 'react';
import { serversApi } from '../lib/api';

interface Server {
  id: string;
  discordServerId: string;
  shopName: string;
  description?: string;
}

export function useServerSelection() {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await serversApi.getMyServers();
      const serversList = response.data;
      setServers(serversList);
      
      // Sélectionner automatiquement le premier serveur
      if (serversList.length > 0) {
        setSelectedServerId(serversList[0].id);
      }
    } catch (err: any) {
      console.error('Erreur chargement serveurs:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des serveurs');
    } finally {
      setLoading(false);
    }
  };

  return {
    servers,
    selectedServerId,
    setSelectedServerId,
    loading,
    error,
    refresh: loadServers,
  };
}