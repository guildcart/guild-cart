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
  type: 'PDF' | 'SERIAL' | 'ROLE';
  stock: string;
  active: boolean;
  fileUrl?: string;
  roleId?: string;
  serialCredentials?: string;
  // Abonnement rôles
  roleDurationType?: 'permanent' | 'temporary' | 'lifetime';
  roleDuration?: string;
  roleAutoRenew?: boolean;
  roleRequiresSubscription?: boolean;
  roleGracePeriodDays?: string;
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
  
  const [serialsText, setSerialsText] = useState('');
  const [serialSeparator, setSerialSeparator] = useState<'newline' | 'dot' | 'comma'>('newline');
  
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: '',
    type: 'PDF',
    stock: '',
    active: true,
    roleDurationType: 'permanent',
    roleDuration: '',
    roleAutoRenew: false,
    roleRequiresSubscription: false,
    roleGracePeriodDays: '7',
  });

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
    return entries.map(e => e.trim()).filter(e => e.length > 0);
  };

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

  // 🆕 Effet pour désactiver le renouvellement si Lifetime est sélectionné
  useEffect(() => {
    if (form.roleDurationType === 'lifetime' && form.roleAutoRenew) {
      setForm(prev => ({
        ...prev,
        roleAutoRenew: false,
        roleRequiresSubscription: false,
      }));
    }
  }, [form.roleDurationType]);

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
        setError('Format non accepté. Formats acceptés : PDF, ZIP, RAR');
        return;
      }
    }

    try {
      setUploadingFile(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      handleInputChange('fileUrl', response.data.url);
    } catch (err: any) {
      console.error('Erreur upload:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'upload du fichier');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.description.trim() || !form.price) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (parseFloat(form.price) <= 0) {
      setError('Le prix doit être supérieur à 0');
      return;
    }

    if (form.type === 'PDF' && !form.fileUrl) {
      setError('Veuillez uploader un fichier PDF');
      return;
    }

    if (form.type === 'ROLE') {
      if (!form.roleId) {
        setError('Veuillez sélectionner un rôle Discord');
        return;
      }
      
      // Validation durée temporaire
      if (form.roleDurationType === 'temporary') {
        if (!form.roleDuration || parseInt(form.roleDuration) <= 0) {
          setError('La durée du rôle doit être supérieure à 0 jours');
          return;
        }
      }
      
      // Validation abonnement
      if (form.roleRequiresSubscription && !form.roleAutoRenew) {
        setError('Si vous forcez l\'abonnement, le renouvellement automatique doit être activé');
        return;
      }

      // Validation grace period
      if (form.roleAutoRenew && form.roleGracePeriodDays) {
        const graceDays = parseInt(form.roleGracePeriodDays);
        if (graceDays < 1 || graceDays > 30) {
          setError('La période de grâce doit être entre 1 et 30 jours');
          return;
        }
      }
    }

    if (form.type === 'SERIAL' && parsedSerials.length === 0) {
      setError('Veuillez ajouter au moins un serial');
      return;
    }

    if (!selectedServerId) {
      setError('Aucun serveur sélectionné');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const productData: any = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        type: form.type,
        active: form.active,
        stock: form.stock ? parseInt(form.stock) : null,
      };

      if (form.type === 'PDF') {
        productData.fileUrl = form.fileUrl;
      } else if (form.type === 'ROLE') {
        productData.discordRoleId = form.roleId;
        
        // Configuration de la durée
        if (form.roleDurationType === 'lifetime') {
          productData.roleDuration = -1; // -1 = Lifetime
          productData.roleAutoRenew = false;
          productData.roleRequiresSubscription = false;
        } else if (form.roleDurationType === 'temporary' && form.roleDuration) {
          productData.roleDuration = parseInt(form.roleDuration);
          productData.roleAutoRenew = form.roleAutoRenew || false;
          productData.roleRequiresSubscription = form.roleRequiresSubscription || false;
          
          // Grace period seulement si renouvellement auto
          if (form.roleAutoRenew && form.roleGracePeriodDays) {
            productData.roleGracePeriodDays = parseInt(form.roleGracePeriodDays);
          }
        }
        // Si permanent, on ne définit rien (null)
        
      } else if (form.type === 'SERIAL') {
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
          <p className="text-gray-400 mb-8 text-lg">
            Invitez le bot Guild Cart sur votre serveur Discord pour commencer à vendre vos produits.
          </p>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors shadow-lg"
          >
            Inviter Guild Cart
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-900">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux produits
        </button>

        <div className="mb-8">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
            {/* Nom */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Nom du produit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Ex: Rôle VIP Premium"
                maxLength={100}
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
                maxLength={500}
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
                min="0"
                value={form.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="9.99"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Type de produit <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => handleInputChange('type', e.target.value as 'PDF' | 'SERIAL' | 'ROLE')}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="PDF">📄 Fichier PDF</option>
                <option value="SERIAL">🔑 Serial / Compte</option>
                <option value="ROLE">👑 Rôle Discord</option>
              </select>
            </div>

            {/* FICHIER PDF */}
            {form.type === 'PDF' && (
              <div>
                <label className="block text-white font-semibold mb-2">
                  Fichier PDF <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                  {form.fileUrl ? (
                    <div className="space-y-3">
                      <div className="text-green-400 flex items-center justify-center gap-2">
                        <span className="text-2xl">✅</span>
                        <span className="font-semibold">Fichier uploadé</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInputChange('fileUrl', '')}
                        className="text-red-400 hover:text-red-300 text-sm underline"
                      >
                        Changer le fichier
                      </button>
                    </div>
                  ) : uploadingFile ? (
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Upload en cours...</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-white font-semibold mb-1">Cliquez pour uploader</p>
                      <p className="text-gray-400 text-sm">PDF, ZIP ou RAR (max 50 MB)</p>
                      <input
                        type="file"
                        accept=".pdf,.zip,.rar"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* SERIAL */}
            {form.type === 'SERIAL' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Format des serials <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSerialSeparator('newline')}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                        serialSeparator === 'newline'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Un par ligne
                    </button>
                    <button
                      type="button"
                      onClick={() => setSerialSeparator('dot')}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                        serialSeparator === 'dot'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Séparés par .
                    </button>
                    <button
                      type="button"
                      onClick={() => setSerialSeparator('comma')}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                        serialSeparator === 'comma'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Séparés par ,
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Liste des serials <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={serialsText}
                    onChange={(e) => setSerialsText(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors h-40 resize-none font-mono text-sm"
                    placeholder={
                      serialSeparator === 'newline'
                        ? 'XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY\nZZZZ-ZZZZ-ZZZZ'
                        : serialSeparator === 'dot'
                        ? 'XXXX-XXXX-XXXX.YYYY-YYYY-YYYY.ZZZZ-ZZZZ-ZZZZ'
                        : 'XXXX-XXXX-XXXX,YYYY-YYYY-YYYY,ZZZZ-ZZZZ-ZZZZ'
                    }
                  />
                  {parsedSerials.length > 0 && (
                    <p className="text-green-400 text-sm mt-2">
                      ✅ {parsedSerials.length} serial{parsedSerials.length > 1 ? 's' : ''} détecté{parsedSerials.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* RÔLE DISCORD */}
            {form.type === 'ROLE' && (
              <div className="space-y-4">
                {/* Sélection du rôle */}
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

                {/* 🆕 Configuration de la durée */}
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                    <span className="text-xl">⏱️</span>
                    <span>Configuration de la durée</span>
                  </div>

                  {/* Type de durée */}
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Type de durée <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.roleDurationType}
                      onChange={(e) => handleInputChange('roleDurationType', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="permanent">♾️ Permanent (par défaut)</option>
                      <option value="temporary">⏳ Temporaire (avec durée)</option>
                      <option value="lifetime">💎 Lifetime (paiement unique à vie)</option>
                    </select>
                    <div className="mt-2 text-sm text-gray-400">
                      {form.roleDurationType === 'permanent' && (
                        <p>Le rôle est donné gratuitement ou inclus dans un autre achat</p>
                      )}
                      {form.roleDurationType === 'temporary' && (
                        <p>Le rôle expire après une durée définie (peut être renouvelé automatiquement)</p>
                      )}
                      {form.roleDurationType === 'lifetime' && (
                        <p>✨ Paiement unique, rôle conservé à vie (pas d'abonnement)</p>
                      )}
                    </div>
                  </div>

                  {/* Durée en jours (seulement si temporaire) */}
                  {form.roleDurationType === 'temporary' && (
                    <>
                      <div>
                        <label className="block text-white font-semibold mb-2">
                          Durée en jours <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {[7, 14, 30, 90].map(days => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => handleInputChange('roleDuration', days.toString())}
                              className={`px-4 py-2 rounded-lg transition-colors ${
                                form.roleDuration === days.toString()
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              {days} jours
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          min="1"
                          value={form.roleDuration}
                          onChange={(e) => handleInputChange('roleDuration', e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                          placeholder="Ou entrez un nombre personnalisé"
                        />
                      </div>

                      {/* Renouvellement automatique */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="roleAutoRenew"
                          checked={form.roleAutoRenew}
                          onChange={(e) => handleInputChange('roleAutoRenew', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-800 mt-0.5"
                        />
                        <div>
                          <label htmlFor="roleAutoRenew" className="text-white font-semibold cursor-pointer">
                            🔄 Renouvellement automatique (Abonnement)
                          </label>
                          <p className="text-gray-400 text-sm mt-1">
                            À la fin de la période, tentative automatique de renouvellement via Stripe.
                            Le client peut annuler à tout moment.
                          </p>
                        </div>
                      </div>

                      {/* Forcer l'abonnement */}
                      {form.roleAutoRenew && (
                        <>
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="roleRequiresSubscription"
                              checked={form.roleRequiresSubscription}
                              onChange={(e) => handleInputChange('roleRequiresSubscription', e.target.checked)}
                              className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-800 mt-0.5"
                            />
                            <div>
                              <label htmlFor="roleRequiresSubscription" className="text-white font-semibold cursor-pointer">
                                🔒 Forcer l'abonnement (carte bancaire uniquement)
                              </label>
                              <p className="text-gray-400 text-sm mt-1">
                                Les clients devront utiliser une carte bancaire. Pas de crypto ni paiement unique.
                              </p>
                            </div>
                          </div>

                          {/* 🆕 NOUVEAU : Grace Period */}
                          <div>
                            <label className="block text-white font-semibold mb-2">
                              ⏰ Période de grâce (réessais de paiement)
                            </label>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                              {[3, 7, 14].map(days => (
                                <button
                                  key={days}
                                  type="button"
                                  onClick={() => handleInputChange('roleGracePeriodDays', days.toString())}
                                  className={`px-4 py-2 rounded-lg transition-colors ${
                                    form.roleGracePeriodDays === days.toString()
                                      ? 'bg-yellow-600 text-white'
                                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  }`}
                                >
                                  {days} jours
                                </button>
                              ))}
                            </div>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={form.roleGracePeriodDays}
                              onChange={(e) => handleInputChange('roleGracePeriodDays', e.target.value)}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                              placeholder="Entre 1 et 30 jours"
                            />
                            <div className="mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                              <p className="text-yellow-400 text-sm">
                                <span className="font-semibold">Comment ça fonctionne :</span><br/>
                                Si le paiement échoue, {form.roleGracePeriodDays || 7} tentatives seront faites (1 par jour pendant {form.roleGracePeriodDays || 7} jours).
                                Le client recevra un message Discord à chaque échec avec un lien pour mettre à jour sa carte bancaire.
                                Si après {form.roleGracePeriodDays || 7} jours le paiement échoue toujours, le rôle sera retiré.
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Message pour Lifetime */}
                  {form.roleDurationType === 'lifetime' && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <p className="text-green-400 text-sm flex items-start gap-2">
                        <span className="text-lg">💎</span>
                        <span>
                          <span className="font-semibold">Lifetime activé :</span> Le client paie une seule fois et garde le rôle à vie.
                          Parfait pour les accès VIP permanents ou les récompenses exclusives.
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stock */}
            {form.type !== 'ROLE' && (
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
                  Le produit sera désactivé automatiquement quand le stock sera épuisé
                </p>
              </div>
            )}

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