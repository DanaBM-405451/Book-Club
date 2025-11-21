// src/app/notifications/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar';
import FriendRequestCard from '@/components/social/FriendRequestCard';
import { Bell, Inbox } from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

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
      const response = await api.get('/friends/requests');
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />

      <div className="ml-20 min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-accent-100 p-3 rounded-xl">
                <Bell className="w-8 h-8 text-accent-600" />
              </div>
              <div>
                <h1 className="text-3xl font-heading">Notificaciones</h1>
                <p className="text-neutral-600 font-ui">
                  {requests.length} solicitud{requests.length !== 1 ? 'es' : ''} pendiente
                  {requests.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              <p className="mt-4 text-neutral-600 font-ui">Cargando notificaciones...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="card-vintage text-center py-12">
              <Inbox className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-xl font-heading text-neutral-700 mb-2">
                No tienes notificaciones
              </h2>
              <p className="text-neutral-500 font-ui">
                Las solicitudes de amistad aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <FriendRequestCard key={request.id} request={request} onUpdate={loadRequests} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}