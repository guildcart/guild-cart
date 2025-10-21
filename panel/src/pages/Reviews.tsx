// panel/src/pages/Reviews.tsx

import { useEffect, useState } from 'react';
import { Star, MessageSquare, TrendingUp, Loader, AlertCircle } from 'lucide-react';
import { useServerSelection } from '../hooks/useServerSelection';
import api from '../lib/api';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    username: string;
    avatar: string | null;
  };
  order: {
    id: string;
    amount: number;
    createdAt: string;
    product: {
      name: string;
    };
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewsData {
  reviews: Review[];
  stats: ReviewStats;
}

export default function Reviews() {
  const { selectedServerId, loading: serverLoading } = useServerSelection();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReviewsData | null>(null);

  useEffect(() => {
    if (selectedServerId) {
      fetchReviews();
    }
  }, [selectedServerId]);

  const fetchReviews = async () => {
    if (!selectedServerId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/reviews/server/${selectedServerId}`);
      setData(response.data);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des avis');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const getPercentage = (count: number, total: number) => {
    return total === 0 ? 0 : Math.round((count / total) * 100);
  };

  if (serverLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement des avis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <div>
            <h3 className="text-red-300 font-semibold mb-1">Erreur</h3>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Avis clients</h1>
        <p className="text-gray-400">Consultez les retours de vos clients</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Reviews */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-semibold">Total d'avis</h3>
            <MessageSquare className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">{data.stats.totalReviews}</p>
          <p className="text-gray-500 text-sm mt-1">
            {data.stats.totalReviews > 0 ? 'Merci à vos clients !' : 'Aucun avis pour le moment'}
          </p>
        </div>

        {/* Average Rating */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-semibold">Note moyenne</h3>
            <TrendingUp className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold text-white">
              {data.stats.averageRating.toFixed(1)}
            </p>
            {renderStars(Math.round(data.stats.averageRating), 'lg')}
          </div>
          <p className="text-gray-500 text-sm mt-1">Sur 5 étoiles</p>
        </div>

        {/* Rating Distribution */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-gray-400 font-semibold mb-3">Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = data.stats.ratingDistribution[stars as keyof typeof data.stats.ratingDistribution];
              const percentage = getPercentage(count, data.stats.totalReviews);
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-white text-sm w-3">{stars}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-sm w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Tous les avis</h2>

        {data.reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Aucun avis pour le moment</p>
            <p className="text-gray-500 text-sm">
              Les avis apparaîtront ici une fois que vos clients auront laissé leur retour.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-gray-900 rounded-lg p-5 hover:bg-gray-850 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {review.user.username.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-white font-semibold">{review.user.username}</h3>
                        <p className="text-gray-500 text-sm">
                          {review.order.product.name} • {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      {renderStars(review.rating)}
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <p className="text-gray-300 text-sm mt-2 leading-relaxed">
                        "{review.comment}"
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Commande #{review.order.id.slice(0, 8)}</span>
                      <span>•</span>
                      <span>{review.order.amount.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}