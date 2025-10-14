import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Loader, AlertCircle } from 'lucide-react';
import { productsApi, discordApi } from '../lib/api';
import api from '../lib/api';
import { useServerSelection } from '../hooks/useServerSelection';

interface ProductForm {
  name: string;
  description: string;
  price: string;
  type: 'PDF' | 'ACCOUNT' | 'ROLE';
  stock: string;
  active: boolean;
  fileUrl?: string;
  roleId?: string;
  serialCredentials?: string;
}

interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

const DISCORD_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;

export default function AddProduct() {
  const navigate = useNavigate();
  const { selectedServerId, loading: loadingServers } = useServerSelection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [discordRoles, setDiscordRoles] = useState<DiscordRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  // 🆕 États pour la gestion des serials
  const [serialsText, setSerialsText] = useState('');
  const [serialSeparator, setSerialSeparator] = useState<'newline' | 'dot' | 'comma'>('newline');
  
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: '',
    type: 'PDF',
    stock: '',
    active: true,
  });

  // 🆕 Parser les serials selon le séparateur
  const parseSerials = (text: string): string[] => {
    if (!text.trim()) return [];

    let entries: string[] = [];
    
    switch (serialSeparator) {
      case 'newline':
        entries = text.split('\n').filter(e => e.trim());
        break;
      case 'dot':
        entries = text.split('.').filter(e => e.trim());
        break;
      case 'comma':
        entries = text.split(',').filter(e => e.trim());
        break;
    }

    // Retourner simplement les serials nettoyés
    return entries.map(e => e.trim()).filter(e => e.length > 0);
  };

  // 🆕 Aperçu des serials parsés
  const parsedSerials = parseSerials(serialsText);

  useEffect(() => {
    async function loadDiscordRoles() {
      if (form.type === 'ROLE' && selectedServerId) {
        setLoadingRoles(true);
        setDiscordRoles([]);
        setError(null);
        
        try {
          const serverResponse = await api.get(`/servers/${selectedServerId}`);
          const server = serverResponse.data;
          
          if (!server.discordServerId) {
            setError('Ce serveur n\'a pas d\'ID Discord associé');
            setLoadingRoles(false);
            return;
          }

          const rolesResponse = await discordApi.getGuildRoles(server.discordServerId);
          setDiscordRoles(rolesResponse.data);
        } catch (err: any) {
          console.error('❌ Erreur chargement rôles:', err);
          setError(err.response?.data?.message || 'Impossible de charger les rôles Discord');
          setDiscordRoles([]);
        } finally {
          setLoadingRoles(false);
        }
      }
    }

    loadDiscordRoles();
  }, [form.type, selectedServerId]);

  const handleInputChange = (field: keyof ProductForm, value: any) => {
    setForm({ ...form, [field]: value });
    setError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/vnd.rar',
    ];

    if (!allowedTypes.includes(file.type) && file.type !== 'application/octet-stream') {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'zip', 'rar'].includes(ext || '')) {
        setError('Format non accepté. Formats autorisés : PDF, ZIP, RAR');
        return;
      }
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 100MB');
      return;
    }

    try {
      setUploadingFile(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      handleInputChange('fileUrl', response.data.url);
    } catch (err: any) {
      console.error('Erreur upload:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'upload du fichier');
    } finally {
      setUploadingFile(false);
    }
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      setError('Le nom du produit est requis');
      return false;
    }
    if (!form.description.trim()) {
      setError('La description est requise');
      return false;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      setError('Le prix doit être supérieur à 0');
      return false;
    }
    if (form.type === 'PDF' && !form.fileUrl) {
      setError('Veuillez uploader un fichier');
      return false;
    }
    if (form.type === 'ROLE' && !form.roleId) {
      setError('Veuillez sélectionner un rôle Discord');
      return false;
    }
    if (form.type === 'ACCOUNT' && parsedSerials.length === 0) {
      setError('Veuillez entrer au moins un serial/clé');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedServerId) {
      if (!selectedServerId) {
        setError('Aucun serveur sélectionné');
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const productData: any = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        type: form.type,
        active: form.active,
        stock: form.stock ? parseInt(form.stock) : null,
      };

      if (form.type === 'PDF') {
        productData.fileUrl = form.fileUrl;
      } else if (form.type === 'ROLE') {
        productData.discordRoleId = form.roleId;
      } else if (form.type === 'ACCOUNT') {
        // 🆕 Stocker les serials parsés en JSON (tableau de strings)
        productData.serialCredentials = JSON.stringify(parsedSerials);
      }

      await productsApi.createProduct(selectedServerId, productData);
      navigate('/products');
    } catch (err: any) {
      console.error('Erreur création:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  };

  if (loadingServers) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement...</p>
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
          <p className="text-gray-400 mb-6 text-lg">
            Vous devez d'abord inviter le bot Guild Cart sur votre serveur Discord.
          </p>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Inviter le bot sur mon serveur
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-900">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/products')}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux produits
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Ajouter un produit</h1>
          <p className="text-gray-400">Créez un nouveau produit pour votre boutique</p>
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

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-lg">
          <div className="space-y-6">
            {/* Nom du produit */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Nom du produit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Ex: Pack Premium, Clé d'activation..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors h-32 resize-none"
                placeholder="Décrivez votre produit..."
              />
            </div>

            {/* Prix */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Prix (€) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="9.99"
              />
            </div>

            {/* Type de produit */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Type de produit <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="PDF">📄 Fichier numérique (PDF, ZIP, RAR)</option>
                <option value="ACCOUNT">🔑 Serials / Clés / Codes</option>
                <option value="ROLE">👑 Rôle Discord</option>
              </select>
            </div>

            {/* Section PDF */}
            {form.type === 'PDF' && (
              <div>
                <label className="block text-white font-semibold mb-2">
                  Fichier <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.zip,.rar"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {uploadingFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader className="w-5 h-5 animate-spin text-purple-600" />
                        <span className="text-gray-400">Upload en cours...</span>
                      </div>
                    ) : form.fileUrl ? (
                      <div className="text-green-400">
                        <p className="font-semibold">✓ Fichier uploadé</p>
                        <p className="text-sm text-gray-400 mt-1">Cliquez pour remplacer</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-white font-semibold">Cliquez pour uploader</p>
                        <p className="text-gray-400 text-sm mt-1">PDF, ZIP ou RAR (max 100MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Section SERIALS (ACCOUNT) */}
            {form.type === 'ACCOUNT' && (
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <p className="text-blue-400 text-sm mb-2">
                    💡 <strong>Format :</strong> Entrez vos serials/clés/codes
                  </p>
                  <p className="text-blue-300 text-xs">
                    Un serial par ligne, par point ou par virgule selon votre choix
                  </p>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Séparateur <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={serialSeparator}
                    onChange={(e) => setSerialSeparator(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="newline">Nouvelle ligne (chaque ligne = 1 serial)</option>
                    <option value="dot">Point (.) - chaque point = 1 serial</option>
                    <option value="comma">Virgule (,) - chaque virgule = 1 serial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Liste des serials/clés <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={serialsText}
                    onChange={(e) => setSerialsText(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors h-40 resize-none font-mono text-sm"
                    placeholder={
                      serialSeparator === 'newline' 
                        ? 'XXXX-XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY-YYYY\nZZZZ-ZZZZ-ZZZZ-ZZZZ'
                        : serialSeparator === 'dot'
                        ? 'XXXX-XXXX-XXXX-XXXX.YYYY-YYYY-YYYY-YYYY.ZZZZ-ZZZZ-ZZZZ-ZZZZ'
                        : 'XXXX-XXXX-XXXX-XXXX,YYYY-YYYY-YYYY-YYYY,ZZZZ-ZZZZ-ZZZZ-ZZZZ'
                    }
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Format libre : clés produit, codes d'activation, identifiants, etc.
                  </p>
                </div>

                {/* Aperçu des serials détectés */}
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-400 text-sm">
                      <strong>Serials détectés :</strong>
                    </p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      parsedSerials.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {parsedSerials.length} serial{parsedSerials.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {parsedSerials.length > 0 ? (
                    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                      {parsedSerials.map((serial, index) => (
                        <div key={index} className="bg-gray-950 p-2 rounded text-xs flex items-center gap-2">
                          <span className="text-green-400">#{index + 1}</span>
                          <span className="text-blue-400 font-mono">{serial}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs mt-2">
                      Aucun serial détecté. Vérifiez le format.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Section ROLE */}
            {form.type === 'ROLE' && (
              <div>
                <label className="block text-white font-semibold mb-2">
                  Rôle Discord <span className="text-red-500">*</span>
                </label>
                {loadingRoles ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader className="w-4 h-4 animate-spin" />
                    Chargement des rôles...
                  </div>
                ) : discordRoles.length > 0 ? (
                  <select
                    value={form.roleId}
                    onChange={(e) => handleInputChange('roleId', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="">Sélectionner un rôle</option>
                    {discordRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-400 text-sm">
                    Aucun rôle assignable disponible
                  </p>
                )}
              </div>
            )}

            {/* Stock */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Stock (optionnel)
              </label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Laisser vide pour stock illimité"
              />
              <p className="text-gray-500 text-xs mt-1">
                Si vous définissez un stock, le produit sera désactivé automatiquement quand il sera épuisé
              </p>
            </div>

            {/* Actif */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="active" className="text-white font-semibold">
                Produit actif (visible dans la boutique)
              </label>
            </div>

            {/* Boutons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer le produit'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}