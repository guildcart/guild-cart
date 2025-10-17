// panel/src/pages/Products.tsx - AVEC MODALE DE SUPPRESSION STYLÉE

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, AlertCircle, Search, Package, X, AlertTriangle } from 'lucide-react';
import { productsApi } from '../lib/api';
import { useServerSelection } from '../hooks/useServerSelection';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'PDF' | 'SERIAL' | 'ROLE';
  stock: number | null;
  active: boolean;
  salesCount: number;
  createdAt: string;
}

const DISCORD_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;

export default function Products() {
  const navigate = useNavigate();
  const { selectedServerId, loading: loadingServers } = useServerSelection();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // 🆕 État pour la modale de suppression
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    if (selectedServerId && !loadingServers) {
      loadProducts();
    }
  }, [selectedServerId, loadingServers]);

  const loadProducts = async () => {
    if (!selectedServerId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await productsApi.getServerProducts(selectedServerId);
      setProducts(response.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des produits:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Ouvrir la modale de confirmation
  const openDeleteModal = (product: Product) => {
    setProductToDelete(product);
  };

  // 🆕 Fermer la modale
  const closeDeleteModal = () => {
    setProductToDelete(null);
  };

  // 🆕 Confirmer la suppression
  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setDeletingId(productToDelete.id);
      await productsApi.deleteProduct(productToDelete.id);
      setProducts(products.filter(p => p.id !== productToDelete.id));
      closeDeleteModal();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (productId: string, currentActive: boolean) => {
    try {
      await productsApi.updateProduct(productId, { active: !currentActive });
      setProducts(products.map(p => 
        p.id === productId ? { ...p, active: !currentActive } : p
      ));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'PDF': return '📄';
      case 'ROLE': return '👑';
      case 'SERIAL': return '🔑';
      default: return '📦';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PDF': return 'Fichier';
      case 'SERIAL': return 'Serials';
      case 'ROLE': return 'Rôle Discord';
      default: return type;
    }
  };

  const getStockDisplay = (product: Product) => {
    if (product.type === 'SERIAL') {
      return (
        <span className={`${product.stock && product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {product.stock || 0}
        </span>
      );
    } else {
      if (product.stock === null) {
        return <span className="text-blue-400">∞</span>;
      } else {
        return (
          <span className={product.stock > 0 ? 'text-green-400' : 'text-red-400'}>
            {product.stock}
          </span>
        );
      }
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
            Invitez le bot Guild Cart sur votre serveur Discord pour commencer à vendre vos produits.
          </p>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Inviter le bot
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
          <p className="text-gray-400">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 p-8 overflow-y-auto bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Produits</h1>
              <p className="text-gray-400">Gérez vos produits en vente</p>
            </div>
            <button
              onClick={() => navigate('/products/new')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Ajouter un produit
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-500 font-semibold mb-1">Erreur</h3>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg mb-2">
                {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit pour le moment'}
              </p>
              {!searchTerm && (
                <p className="text-gray-500 text-sm">
                  Commencez par ajouter votre premier produit
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-purple-500 transition-all shadow-lg"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{getTypeEmoji(product.type)}</div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{product.name}</h3>
                          <span className="text-sm text-gray-400">{getTypeLabel(product.type)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(product.id, product.active)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            product.active ? 'bg-green-600' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              product.active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-900 rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-xs mb-1">Prix</p>
                        <p className="text-white font-bold">{product.price.toFixed(2)}€</p>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-xs mb-1">Stock</p>
                        <p className="text-white font-bold">
                          {getStockDisplay(product)}
                        </p>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-xs mb-1">Ventes</p>
                        <p className="text-white font-bold">{product.salesCount}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Modifier
                      </button>
                      <button
                        onClick={() => openDeleteModal(product)}
                        disabled={deletingId === product.id}
                        className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === product.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🆕 MODALE DE CONFIRMATION DE SUPPRESSION */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Supprimer le produit</h2>
                  <p className="text-sm text-gray-400">Cette action est irréversible</p>
                </div>
              </div>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Infos du produit */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{getTypeEmoji(productToDelete.type)}</div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{productToDelete.name}</h3>
                    <span className="text-sm text-gray-400">{getTypeLabel(productToDelete.type)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Prix :</span>
                    <span className="text-white font-semibold ml-2">{productToDelete.price.toFixed(2)}€</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Ventes :</span>
                    <span className="text-white font-semibold ml-2">{productToDelete.salesCount}</span>
                  </div>
                </div>
              </div>

              {/* Avertissements */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400">
                    Le produit sera définitivement supprimé de votre boutique
                  </p>
                </div>
                
                {productToDelete.salesCount > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-yellow-400">
                      Ce produit a déjà {productToDelete.salesCount} vente{productToDelete.salesCount > 1 ? 's' : ''}, l'historique sera conservé
                    </p>
                  </div>
                )}

                {productToDelete.type === 'PDF' && (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <p className="text-orange-400">
                      Le fichier uploadé sera également supprimé du serveur
                    </p>
                  </div>
                )}

                {productToDelete.type === 'SERIAL' && productToDelete.stock && productToDelete.stock > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-400">
                      {productToDelete.stock} serial{productToDelete.stock > 1 ? 's non utilisé' : ' non utilisé'}{productToDelete.stock > 1 ? 's' : ''} sera{productToDelete.stock > 1 ? 'ont' : ''} perdu{productToDelete.stock > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>

              {/* Question de confirmation */}
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm font-semibold text-center">
                  Êtes-vous vraiment sûr de vouloir supprimer ce produit ?
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-700">
              <button
                onClick={closeDeleteModal}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId === productToDelete.id}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deletingId === productToDelete.id ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Supprimer définitivement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}