import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, AlertCircle } from 'lucide-react';
import { productsApi, discordApi } from '../lib/api';
import api from '../lib/api';
import { useServerSelection } from '../hooks/useServerSelection';

type ProductType = 'PDF' | 'SERIAL' | 'ROLE';

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedServerId, loading: serverLoading } = useServerSelection();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [discordRoles, setDiscordRoles] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Données du produit
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [productType, setProductType] = useState<ProductType>('PDF');
  const [stock, setStock] = useState<string>('');
  const [active, setActive] = useState(true);

  // Spécifique PDF
  const [fileUrl, setFileUrl] = useState('');

  // 🆕 Spécifique SERIALS (SERIAL)
  const [serialsText, setSerialsText] = useState('');
  const [serialSeparator, setSerialSeparator] = useState<'newline' | 'dot' | 'comma'>('newline');

  // Spécifique ROLE
  const [roleId, setRoleId] = useState('');

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

  // Charger le produit
  useEffect(() => {
    async function loadProduct() {
      if (!id) return;

      try {
        setLoading(true);
        const response = await productsApi.getProduct(id);
        const product = response.data;

        setName(product.name);
        setDescription(product.description);
        setPrice(product.price.toString());
        setProductType(product.type);
        setStock(product.stock?.toString() || '');
        setActive(product.active);

        if (product.type === 'PDF') {
          setFileUrl(product.fileUrl || '');
        } else if (product.type === 'SERIAL') {
          if (product.serialCredentials) {
            try {
              const serials = JSON.parse(product.serialCredentials);
              
              // Si c'est un tableau de strings (nouveau format)
              if (Array.isArray(serials) && typeof serials[0] === 'string') {
                setSerialsText(serials.join('\n'));
              }
              // Rétrocompatibilité ancien format login:password
              else if (Array.isArray(serials) && serials[0]?.login) {
                const text = serials.map((acc: any) => `${acc.login}:${acc.password}`).join('\n');
                setSerialsText(text);
              }
              // Si c'est un seul objet (ancien format)
              else if (serials.login) {
                setSerialsText(`${serials.login}:${serials.password}`);
              }
            } catch (e) {
              console.error('Erreur parsing serials:', e);
            }
          }
        } else if (product.type === 'ROLE') {
          setRoleId(product.discordRoleId || '');
        }
      } catch (error) {
        console.error('Erreur chargement produit:', error);
        setError('Impossible de charger le produit');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  // Charger les rôles Discord si type ROLE
  useEffect(() => {
    async function loadDiscordRoles() {
      if (productType === 'ROLE' && selectedServerId) {
        setLoadingRoles(true);
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
        } catch (error: any) {
          console.error('Erreur chargement rôles:', error);
          setError(error.response?.data?.message || 'Impossible de charger les rôles Discord');
          setDiscordRoles([]);
        } finally {
          setLoadingRoles(false);
        }
      }
    }

    loadDiscordRoles();
  }, [productType, selectedServerId]);

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

    try {
      setUploadingFile(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFileUrl(response.data.url);
    } catch (error: any) {
      console.error('Erreur upload:', error);
      setError(error.response?.data?.message || 'Erreur lors de l\'upload du fichier');
    } finally {
      setUploadingFile(false);
    }
  };

  // Sauvegarder les modifications
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedServerId) {
      setError('Aucun serveur sélectionné');
      return;
    }

    // Validation
    if (!name.trim()) {
      setError('Le nom du produit est requis');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      setError('Le prix doit être supérieur à 0');
      return;
    }

    if (productType === 'PDF' && !fileUrl) {
      setError('Le fichier est requis');
      return;
    }

    if (productType === 'SERIAL' && parsedSerials.length === 0) {
      setError('Veuillez entrer au moins un serial/clé');
      return;
    }

    if (productType === 'ROLE' && !roleId) {
      setError('Le rôle Discord est requis');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const productData: any = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        active,
      };

      if (stock.trim()) {
        productData.stock = parseInt(stock);
      }

      if (productType === 'PDF') {
        productData.fileUrl = fileUrl;
      } else if (productType === 'SERIAL') {
        // 🆕 Stocker les serials parsés en JSON (tableau de strings)
        productData.serialCredentials = JSON.stringify(parsedSerials);
      } else if (productType === 'ROLE') {
        productData.discordRoleId = roleId;
      }

      await productsApi.updateProduct(id!, productData);
      navigate('/products');
    } catch (error: any) {
      console.error('Erreur mise à jour produit:', error);
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour du produit');
    } finally {
      setSaving(false);
    }
  }

  if (serverLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!selectedServerId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">Aucun serveur sélectionné</p>
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
          <h1 className="text-3xl font-bold text-white mb-2">Modifier le produit</h1>
          <p className="text-gray-400">Modifiez les informations de votre produit</p>
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
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="9.99"
              />
            </div>

            {/* Type de produit (non modifiable) */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Type de produit
              </label>
              <div className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-400">
                {productType === 'PDF' && '📄 Fichier numérique (PDF, ZIP, RAR)'}
                {productType === 'SERIAL' && '🔑 Serials / Clés / Codes'}
                {productType === 'ROLE' && '👑 Rôle Discord'}
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Le type de produit ne peut pas être modifié
              </p>
            </div>

            {/* Section PDF */}
            {productType === 'PDF' && (
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
                        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                        <span className="text-gray-400">Upload en cours...</span>
                      </div>
                    ) : fileUrl ? (
                      <div className="text-green-400">
                        <p className="font-semibold">✓ Fichier présent</p>
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

            {/* Section SERIALS (SERIAL) */}
            {productType === 'SERIAL' && (
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
            {productType === 'ROLE' && (
              <div>
                <label className="block text-white font-semibold mb-2">
                  Rôle Discord <span className="text-red-500">*</span>
                </label>
                {loadingRoles ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement des rôles...
                  </div>
                ) : discordRoles.length > 0 ? (
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
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
                value={stock}
                onChange={(e) => setStock(e.target.value)}
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
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
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
                disabled={saving}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Sauvegarder les modifications
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}