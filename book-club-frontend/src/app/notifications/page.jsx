// src/app/notifications/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar';
import FriendRequestCard from '@/components/social/FriendRequestCard'; // Usamos el componente corregido
import { Bell, Inbox } from 'lucide-react';
import api from '@/lib/api';
import { Toaster } from 'react-hot-toast';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadRequests();
  }, [isAuthenticated, router]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      // Llamada a la ruta que confirmaste en Postman
      const response = await api.get('/api/social/friends/requests');
      
      // Ajustamos según venga la data (data.data o data directo)
      const requestList = response.data.data || response.data || [];
      setRequests(requestList);
      
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      // Opcional: toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />

      {/* Mismo layout padding que tus otras páginas (ml-20) */}
      <div className="ml-20 min-h-screen bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          
          {/* Header igual a tu diseño */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-secondary-100 p-3 rounded-xl">
              <Bell className="w-8 h-8 text-secondary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-heading text-neutral-900">Notificaciones</h1>
              <p className="text-neutral-600 font-ui">
                {requests.length === 1 
                  ? '1 solicitud pendiente' 
                  : `${requests.length} solicitudes pendientes`}
              </p>
            </div>
          </div>

          {/* Contenido */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-24 bg-white rounded-xl animate-pulse border border-neutral-200"></div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-neutral-300">
              <div className="bg-neutral-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-xl font-heading text-neutral-700 mb-1">Estás al día</h3>
              <p className="text-neutral-500 font-ui">No tienes notificaciones nuevas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <FriendRequestCard 
                  key={request.id || request.friendshipId} 
                  request={request} 
                  onUpdate={loadRequests} // Recargar lista tras aceptar/rechazar
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}