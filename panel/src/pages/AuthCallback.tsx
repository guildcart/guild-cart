import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    
    console.log('🔐 AuthCallback: Token reçu:', token ? 'Oui' : 'Non');
    
    if (token) {
      console.log('🔄 AuthCallback: Tentative de connexion...');
      
      login(token)
        .then(() => {
          console.log('✅ AuthCallback: Connexion réussie, redirection vers /');
          navigate('/', { replace: true });
        })
        .catch((error) => {
          console.error('❌ AuthCallback: Erreur de connexion:', error);
          navigate('/login', { replace: true });
        });
    } else {
      console.warn('⚠️ AuthCallback: Pas de token, redirection vers /login');
      navigate('/login', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h2 className="text-white text-xl font-semibold mb-2">Connexion en cours...</h2>
        <p className="text-gray-400 text-sm">Veuillez patienter</p>
      </div>
    </div>
  );
}