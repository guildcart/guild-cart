// panel/src/pages/ReviewForm.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, CheckCircle, AlertCircle, Loader, MessageSquare } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ReviewInfo {
  orderId: string;
  productName: string;
  shopName: string;
  amount: number;
  hasReview: boolean;
  existingReview?: {
    rating: number;
    comment: string;
  };
}

export default function ReviewForm() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [info, setInfo] = useState<ReviewInfo | null>(null);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchReviewInfo();
  }, [token]);

  const fetchReviewInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/reviews/info/${token}`);
      setInfo(response.data);
      
      // Si un avis existe déjà, pré-remplir le formulaire
      if (response.data.existingReview) {
        setRating(response.data.existingReview.rating);
        setComment(response.data.existingReview.comment || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Token invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      await axios.post(`${API_URL}/reviews/${token}`, {
        rating,
        comment: comment.trim() || undefined,
      });
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi de l\'avis');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Erreur</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Merci pour votre avis !</h1>
          <p className="text-gray-400 mb-6">
            Votre retour nous aide à améliorer notre service.
          </p>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            {comment && (
              <p className="text-gray-300 text-sm mt-3 italic">"{comment}"</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (info?.hasReview && info.existingReview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Avis déjà soumis</h1>
          <p className="text-gray-400 mb-6">
            Vous avez déjà laissé un avis pour cette commande.
          </p>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= info.existingReview!.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            {info.existingReview.comment && (
              <p className="text-gray-300 text-sm mt-3 italic">
                "{info.existingReview.comment}"
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full mb-4">
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Votre avis compte !</h1>
          <p className="text-gray-400">
            Aidez-nous à améliorer <span className="text-purple-400 font-semibold">{info?.shopName}</span>
          </p>
        </div>

        {/* Order Info */}
        <div className="bg-gray-900 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Produit</p>
              <p className="text-white font-semibold">{info?.productName}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">Commande</p>
              <p className="text-white font-semibold">#{info?.orderId}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-white font-semibold mb-3 text-center">
              Note <span className="text-red-500">*</span>
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600 hover:text-gray-500'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-gray-400 text-sm mt-2">
                {rating === 1 && '😞 Très décevant'}
                {rating === 2 && '😐 Décevant'}
                {rating === 3 && '🙂 Correct'}
                {rating === 4 && '😊 Bien'}
                {rating === 5 && '🤩 Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-white font-semibold mb-2">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none h-32"
              maxLength={500}
            />
            <p className="text-gray-500 text-sm mt-1 text-right">
              {comment.length}/500 caractères
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Star className="w-5 h-5" />
                Envoyer mon avis
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-sm">
            Votre avis sera visible publiquement
          </p>
        </div>
      </div>
    </div>
  );
}