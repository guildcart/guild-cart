// panel/src/pages/Dashboard.tsx

import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Package, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { serversApi, ordersApi } from '../lib/api';
import { useServerSelection } from '../hooks/useServerSelection';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  activeProducts: number;
}

interface RecentOrder {
  id: string;
  productName: string;
  buyerUsername: string;
  amount: number;
  status: string;
  delivered: boolean; // 🆕 Ajout du champ delivered
  createdAt: string;
}

// Lien d'invitation Discord dynamique
const DISCORD_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;

export default function Dashboard() {
  const { selectedServerId, loading: loadingServers } = useServerSelection();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedServerId && !loadingServers) {
      loadDashboardData();
    }
  }, [selectedServerId, loadingServers]);

  const loadDashboardData = async () => {
    if (!selectedServerId) return;

    try {
      setLoading(true);
      setError(null);

      const statsResponse = await serversApi.getStats(selectedServerId);
      setStats(statsResponse.data);

      const ordersResponse = await ordersApi.getServerOrders(selectedServerId);
      setRecentOrders(ordersResponse.data.slice(0, 5));
    } catch (err: any) {
      console.error('Erreur lors du chargement du dashboard:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loadingServers) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des serveurs...</p>
        </div>
      </div>
    );
  }

  if (!selectedServerId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-2xl p-8">
          <div className="text-6xl mb-6">🤖</div>
          <h2 className="text-3xl font-bold text-white mb-4">Aucun serveur Discord connecté</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Pour utiliser Guild Cart, vous devez d'abord inviter le bot sur votre serveur Discord.
          </p>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-lg mx-auto mb-6">
            <p className="text-white font-semibold mb-4 flex items-center gap-2">
              💡 <span>Comment ça fonctionne ?</span>
            </p>
            <ol className="text-gray-300 space-y-3 list-decimal list-inside text-left">
              <li>Invitez le bot Guild Cart sur votre serveur Discord</li>
              <li>Le bot créera automatiquement votre boutique</li>
              <li>Revenez sur ce panel pour gérer vos produits</li>
            </ol>
          </div>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors shadow-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 71 55" fill="none">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z" fill="currentColor"/>
            </svg>
            Inviter le bot sur Discord
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Erreur</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Vue d'ensemble de votre boutique</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold mb-1">
              {stats?.totalRevenue?.toFixed(2) || '0.00'}€
            </div>
            <div className="text-green-100 text-sm">Revenus totaux</div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.totalOrders || 0}</div>
            <div className="text-blue-100 text-sm">Commandes totales</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.totalProducts || 0}</div>
            <div className="text-purple-100 text-sm">Produits totaux</div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.activeProducts || 0}</div>
            <div className="text-orange-100 text-sm">Produits actifs</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">Commandes récentes</h2>
          
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Aucune commande pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {order.buyerUsername?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{order.productName}</div>
                      <div className="text-gray-400 text-sm">
                        {order.buyerUsername} • {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">+{order.amount.toFixed(2)}€</div>
                    {/* 🆕 MODIFICATION ICI - Affichage du statut avec delivered */}
                    <div className={`text-sm ${
                      order.delivered ? 'text-green-500' :  // ✅ Livré
                      order.status === 'pending' ? 'text-yellow-500' :  // ⏳ En attente
                      order.status === 'completed' ? 'text-blue-500' :  // ✓ Payé (mais pas encore livré)
                      'text-red-500'  // ❌ Échoué
                    }`}>
                      {order.delivered ? '✅ Livré' : 
                       order.status === 'pending' ? '⏳ En attente' : 
                       order.status === 'completed' ? '✓ Payé' : 
                       '❌ Échoué'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}