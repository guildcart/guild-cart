// panel/src/pages/DeliveryView.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Package, Copy, CheckCircle, Download, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface DeliveryData {
  orderId: string;
  productName: string;
  productType: 'PDF' | 'SERIAL' | 'ROLE';
  shopName: string;
  amount: number;
  deliveredAt: string;
  serials?: string[];
  fileUrl?: string;
}

export default function DeliveryView() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DeliveryData | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchDelivery();
  }, [token]);

  const fetchDelivery = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/delivery/${token}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Token invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Chargement de votre commande...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Erreur</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Si le problème persiste, contactez le support de la boutique.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">🎉 Commande livrée !</h1>
          <p className="text-gray-400">
            Merci pour votre achat sur <span className="text-purple-400 font-semibold">{data.shopName}</span>
          </p>
        </div>

        {/* Order Info */}
        <div className="bg-gray-900 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm mb-1">Commande</p>
              <p className="text-white font-semibold">#{data.orderId}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Produit</p>
              <p className="text-white font-semibold">{data.productName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Montant</p>
              <p className="text-green-400 font-bold text-lg">{data.amount.toFixed(2)}€</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Date</p>
              <p className="text-white">{new Date(data.deliveredAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>

        {/* Content based on product type */}
        {data.productType === 'SERIAL' && data.serials && (
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">
                Vos clés ({data.serials.length})
              </h2>
            </div>
            
            <div className="space-y-3">
              {data.serials.map((serial, index) => (
                <div
                  key={index}
                  className="bg-gray-900 rounded-lg p-4 flex items-center justify-between gap-4 hover:bg-gray-850 transition-colors"
                >
                  <code className="text-purple-300 font-mono text-sm flex-1 break-all">
                    {serial}
                  </code>
                  <button
                    onClick={() => copyToClipboard(serial, index)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex-shrink-0"
                  >
                    {copiedIndex === index ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-semibold">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-sm font-semibold">Copier</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Conservez précieusement ces clés. Ne les partagez avec personne.
              </p>
            </div>
          </div>
        )}

        {data.productType === 'PDF' && data.fileUrl && (
          <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-xl p-6 text-center">
            <Download className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">📄 Document PDF</h2>
            <p className="text-gray-400 mb-6">Votre document est prêt à être téléchargé</p>
            <a
              href={data.fileUrl} // ✅ CORRECTION : Utilise directement fileUrl
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              Télécharger le PDF
            </a>
          </div>
        )}

        {data.productType === 'ROLE' && (
          <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">👑 Rôle Discord attribué</h2>
            <p className="text-gray-400 mb-4">
              Votre rôle Discord a été automatiquement ajouté à votre compte !
            </p>
            <div className="bg-gray-900 rounded-lg p-4 inline-block">
              <p className="text-green-300 font-semibold">
                ✅ Vous pouvez maintenant accéder aux salons VIP
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-sm">
            Besoin d'aide ? Contactez le support de <span className="text-purple-400">{data.shopName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}