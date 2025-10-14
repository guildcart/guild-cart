import { useState, useEffect } from 'react';
import { Save, Loader, AlertCircle, CheckCircle, CreditCard, Server, Palette, Bell } from 'lucide-react';
import { serversApi } from '../lib/api';
import { useServerSelection } from '../hooks/useServerSelection';

interface Settings {
  guildId: string;
  guildName: string;
  shopName: string;
  shopDescription: string;
  primaryColor: string;
  stripePublicKey: string;
  stripeSecretKey: string;
  commissionRate: number;
  webhookUrl: string;
  notifyOnSale: boolean;
}

// Lien d'invitation Discord dynamique
const DISCORD_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;

export default function Settings() {
  const { selectedServerId, loading: loadingServers } = useServerSelection();
  const [settings, setSettings] = useState<Settings>({
    guildId: '',
    guildName: '',
    shopName: '',
    shopDescription: '',
    primaryColor: '#7C3AED',
    stripePublicKey: '',
    stripeSecretKey: '',
    commissionRate: 2,
    webhookUrl: '',
    notifyOnSale: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selectedServerId && !loadingServers) {
      loadSettings();
    }
  }, [selectedServerId, loadingServers]);

  const loadSettings = async () => {
    if (!selectedServerId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await serversApi.getServer(selectedServerId);
      const serverData = response.data;
      
      setSettings({
        guildId: serverData.discordServerId || '',
        guildName: serverData.shopName || '',
        shopName: serverData.shopName || '',
        shopDescription: serverData.description || '',
        primaryColor: '#7C3AED',
        stripePublicKey: '',
        stripeSecretKey: '',
        commissionRate: 2,
        webhookUrl: '',
        notifyOnSale: true,
      });
    } catch (err: any) {
      console.error('Erreur chargement paramètres:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Settings, value: any) => {
    setSettings({ ...settings, [field]: value });
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!settings.shopName.trim()) {
      setError('Le nom de la boutique est requis');
      return;
    }
    if (settings.commissionRate < 0 || settings.commissionRate > 100) {
      setError('Le taux de commission doit être entre 0 et 100%');
      return;
    }

    if (!selectedServerId) {
      setError('Aucun serveur sélectionné');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await serversApi.updateServer(selectedServerId, {
        shopName: settings.shopName,
        description: settings.shopDescription,
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
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
            Invitez le bot Guild Cart sur votre serveur Discord pour accéder aux paramètres.
          </p>
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
          <p className="text-gray-400">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Paramètres</h1>
          <p className="text-gray-400">Configurez votre boutique et vos intégrations</p>
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

        {success && (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-400 font-semibold">Paramètres sauvegardés avec succès !</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Server className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-white">Serveur Discord</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">ID du serveur</label>
                <input
                  type="text"
                  value={settings.guildId}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
                  disabled
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Nom du serveur</label>
                <input
                  type="text"
                  value={settings.guildName}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-white">Apparence de la boutique</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Nom de la boutique <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.shopName}
                  onChange={(e) => handleChange('shopName', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Trading Academy Shop"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Description</label>
                <textarea
                  value={settings.shopDescription}
                  onChange={(e) => handleChange('shopDescription', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors h-24 resize-none"
                  placeholder="Boutique officielle de guides et formations trading"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Couleur principale</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="h-12 w-20 rounded-lg cursor-pointer bg-gray-900 border border-gray-700"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="#7C3AED"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-white">Paiements Stripe</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Clé publique Stripe</label>
                <input
                  type="text"
                  value={settings.stripePublicKey}
                  onChange={(e) => handleChange('stripePublicKey', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="pk_live_..."
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Clé secrète Stripe</label>
                <input
                  type="password"
                  value={settings.stripeSecretKey}
                  onChange={(e) => handleChange('stripeSecretKey', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="sk_live_..."
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Taux de commission (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.commissionRate}
                  onChange={(e) => handleChange('commissionRate', parseFloat(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-white">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">URL du Webhook Discord</label>
                <input
                  type="url"
                  value={settings.webhookUrl}
                  onChange={(e) => handleChange('webhookUrl', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notifyOnSale"
                  checked={settings.notifyOnSale}
                  onChange={(e) => handleChange('notifyOnSale', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-800"
                />
                <label htmlFor="notifyOnSale" className="text-white font-semibold cursor-pointer">
                  Recevoir une notification pour chaque vente
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}