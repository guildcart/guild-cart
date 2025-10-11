import { NavLink } from 'react-router-dom';
import { BarChart3, Package, Settings, LogOut, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: '/', icon: BarChart3, label: 'Dashboard' },
    { to: '/products', icon: Package, label: 'Produits' },
    { to: '/settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-12 h-12 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold">Discord Shop</h2>
            <span className="text-xs text-gray-400">Panel Admin</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {user?.username?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <div className="text-white text-sm font-semibold truncate">
              {user?.username || 'Utilisateur'}
            </div>
            <div className="text-gray-400 text-xs">Propriétaire</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}