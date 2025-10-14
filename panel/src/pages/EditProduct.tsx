import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, AlertCircle } from 'lucide-react';
import { productsApi, discordApi } from '../lib/api';
import api from '../lib/api';
import { useServerSelection } from '../hooks/useServerSelection';

type ProductType = 'PDF' | 'ACCOUNT' | 'ROLE';

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

  // 🆕 Spécifique ACCOUNT - Nouvelle interface
  const [accountsText, setAccountsText] = useState('');
  const [accountSeparator, setAccountSeparator] = useState<'newline' | 'dot' | 'comma'>('newline');

  // Spécifique ROLE
  const [roleId, setRoleId] = useState('');

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
        } else if (product.type === 'ACCOUNT') {
          if (product.accountCredentials) {
            try {
              const creds = JSON.parse(product.accountCredentials);
              
              // 🆕 Convertir le JSON en texte selon le format
              if (Array.isArray(creds)) {
                // Si c'est un tableau de comptes
                const text = creds.map(acc => `${acc.login}:${acc.password}`).join('\n');
                setAccountsText(text);
              } else {
                // Si c'est un seul compte
                setAccountsText(`${creds.login || ''}:${creds.password || ''}`);
              }
            } catch (e) {
              console.error('Erreur parsing accountCredentials:', e);
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

  // 🔧 CORRIGÉ : Charger les rôles Discord avec discordApi
  useEffect(() => {
    async function loadDiscordRoles() {
      if (productType === 'ROLE' && selectedServerId) {
        setLoadingRoles(true);
        try {
          // 1️⃣ Récupérer le serveur pour avoir discordServerId
          const serverResponse = await api.get(`/servers/${selectedServerId}`);
          const server = serverResponse.data;
          
          if (!server.discordServerId) {
            setError('Ce serveur n\'a pas d\'ID Discord associé');
            setLoadingRoles(false);
            return;
          }

          // 2️⃣ Charger les rôles avec discordApi
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

  // 🆕 Parser les comptes selon le séparateur
  const parseAccounts = (text: string): Array<{login: string, password: string}> => {
    if (!text.trim()) return [];

    let entries: string[] = [];
    
    switch (accountSeparator) {
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

    return entries.map(entry => {
      const [login, password] = entry.split(':').map(s => s.trim());
      return {
        login: login || '',
        password: password || ''
      };
    }).filter(acc => acc.login && acc.password);
  };

  // 🆕 Aperçu des comptes parsés
  const parsedAccounts = parseAccounts(accountsText);

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

    if (productType === 'ACCOUNT' && parsedAccounts.length === 0) {
      setError('Veuillez entrer au moins un compte valide');
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
      } else if (productType === 'ACCOUNT') {
        // 🆕 Stocker les comptes parsés en JSON
        productData.accountCredentials = JSON.stringify(parsedAccounts);
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
            <div>
              <label className="block text-white font-semibold mb-2">
                Nom du produit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Guide Ultimate Trading"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                placeholder="Décrivez votre produit en détail..."
                maxLength={500}
              />
              <p className="text-gray-500 text-sm mt-1">
                {description.length}/500 caractères
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Prix (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="29.99"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Stock (optionnel)
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Illimité"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-800"
              />
              <label htmlFor="active" className="text-white font-semibold cursor-pointer">
                Produit actif (visible dans la boutique)
              </label>
            </div>

            {/* Type de produit (non modifiable) */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white font-semibold mb-2">Type : {productType}</h3>
              <p className="text-gray-400 text-sm">
                ℹ️ Le type de produit ne peut pas être modifié
              </p>
            </div>

            {/* Champs spécifiques selon le type */}
            {productType === 'PDF' && (
              <div>
                <label className="block text-white font-semibold mb-2">
                  Fichier <span className="text-red-500">*</span>
                </label>
                {fileUrl && (
                  <div className="mb-3 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                    <p className="text-green-400 text-sm">✅ Fichier actuel : {fileUrl.split('/').pop()}</p>
                  </div>
                )}
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                  {uploadingFile ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-3" />
                      <p className="text-gray-400">Upload en cours...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                      <div className="text-gray-400 mb-2 text-sm">Remplacer le fichier</div>
                      <div className="text-gray-500 text-xs mb-3">PDF, ZIP ou RAR, max 100MB</div>
                      <input
                        type="file"
                        accept=".pdf,.zip,.rar"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload-edit"
                      />
                      <label
                        htmlFor="file-upload-edit"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block transition-colors text-sm"
                      >
                        Choisir un nouveau fichier
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 🆕 NOUVELLE INTERFACE POUR LES COMPTES */}
            {productType === 'ACCOUNT' && (
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <p className="text-blue-400 text-sm mb-2">
                    💡 <strong>Format :</strong> Entrez vos comptes au format <code>login:password</code>
                  </p>
                  <p className="text-blue-300 text-xs">
                    Exemple : <code>user@email.com:motdepasse123</code>
                  </p>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Séparateur <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={accountSeparator}
                    onChange={(e) => setAccountSeparator(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="newline">Nouvelle ligne (chaque ligne = 1 compte)</option>
                    <option value="dot">Point (.) - chaque point = 1 compte</option>
                    <option value="comma">Virgule (,) - chaque virgule = 1 compte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Liste des comptes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={accountsText}
                    onChange={(e) => setAccountsText(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors h-40 resize-none font-mono text-sm"
                    placeholder={
                      accountSeparator === 'newline' 
                        ? 'user1@email.com:password1\nuser2@email.com:password2\nuser3@email.com:password3'
                        : accountSeparator === 'dot'
                        ? 'user1@email.com:password1.user2@email.com:password2.user3@email.com:password3'
                        : 'user1@email.com:password1,user2@email.com:password2,user3@email.com:password3'
                    }
                  />
                </div>

                {/* Aperçu des comptes détectés */}
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-400 text-sm">
                      <strong>Comptes détectés :</strong>
                    </p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      parsedAccounts.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {parsedAccounts.length} compte{parsedAccounts.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {parsedAccounts.length > 0 ? (
                    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                      {parsedAccounts.map((acc, index) => (
                        <div key={index} className="bg-gray-950 p-2 rounded text-xs">
                          <span className="text-green-400">#{index + 1}</span>{' '}
                          <span className="text-blue-400">{acc.login}</span>
                          <span className="text-gray-500"> : </span>
                          <span className="text-purple-400">{'•'.repeat(acc.password.length)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs mt-2">
                      Aucun compte détecté. Vérifiez le format.
                    </p>
                  )}
                </div>
              </div>
            )}

            {productType === 'ROLE' && (
              <div>
                <label className="block text-white font-semibold mb-2">
                  Rôle Discord <span className="text-red-500">*</span>
                </label>
                {loadingRoles ? (
                  <div className="flex items-center gap-2 text-gray-400 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement des rôles...
                  </div>
                ) : (
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
                )}
              </div>
            )}

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
                disabled={saving || uploadingFile}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer
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