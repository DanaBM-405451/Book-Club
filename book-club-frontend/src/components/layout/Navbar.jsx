// src/components/layout/Navbar.jsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { 
  BookOpen, 
  Bell, 
  Search, 
  Users, // Usado para Grupos
  User, 
  LogOut,
  HeartHandshake // Nuevo icono para Amigos
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadNotificationCount();
  }, []);

  const loadNotificationCount = async () => {
    try {
      const response = await api.get('/api/social/friends/requests');
      // Asumiendo que response.data es el array o tiene un campo count
      const count = Array.isArray(response.data) ? response.data.length : (response.data.count || 0);
      setNotificationCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    router.push('/login');
  };

  const navItems = [
    {
      icon: BookOpen,
      label: 'Biblioteca',
      path: '/dashboard',
    },
    {
      icon: Bell,
      label: 'Notificaciones',
      path: '/notifications',
      badge: notificationCount,
    },
    {
      icon: Search,
      label: 'Buscar',
      path: '/friends/search',
    },
    {
      icon: HeartHandshake, // Nuevo item
      label: 'Mis Amigos',
      path: '/friends',
    },
    {
      icon: Users,
      label: 'Grupos',
      path: '/groups',
    },
    {
      icon: User,
      label: 'Perfil',
      path: '/profile',
    },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-20 bg-white border-r border-neutral-200 shadow-card flex flex-col items-center py-6 z-40">
      {/* Logo o Icono Principal (Opcional, si tienes uno arriba del todo) */}
      
      {/* Navigation Items */}
      <div className="flex-1 flex flex-col gap-4 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all group ${
                isActive
                  ? 'bg-primary-500 text-white shadow-vintage'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title={item.label}
            >
              <Icon className="w-6 h-6" />
              
              {/* Tooltip simple al hacer hover (opcional para mejorar UX) */}
              <span className="absolute left-14 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {item.label}
              </span>

              {/* Badge de notificaciones */}
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-ui font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-12 h-12 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-all mb-4"
        title="Cerrar sesión"
      >
        <LogOut className="w-6 h-6" />
      </button>
    </nav>
  );
}