//book-club-frontend/src/components/notifications/FriendRequestNotification.jsx
'use client';

import { useState } from 'react';
import { Check, X, User } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function FriendRequestNotification({ notification, onUpdate }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Extraer datos de la notificación
  // El backend debería enviar metadata: { friendshipId: ..., fromUserId: ... }
  const { friendshipId, fromUserId } = notification.metadata || {};

  const handleAction = async (action) => {
    if (!friendshipId) {
        toast.error("Datos de solicitud inválidos");
        return;
    }
    
    try {
      setLoading(true);
      // action puede ser 'accept' o 'reject'
      await api.post(`/api/social/friends/${friendshipId}/${action}`);
      
      toast.success(action === 'accept' ? '¡Solicitud aceptada!' : 'Solicitud rechazada');
      
      // Avisar al padre para recargar la lista
      if (onUpdate) onUpdate();
      
    } catch (error) {
      console.error(`Error al ${action}:`, error);
      toast.error(`Error al ${action === 'accept' ? 'aceptar' : 'rechazar'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-secondary-100 text-secondary-600 rounded-full flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-ui font-medium text-neutral-900">
            {notification.title || "Solicitud de Amistad"}
          </p>
          <p className="text-xs text-neutral-500">
            {notification.message}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {new Date(notification.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleAction('reject')}
          disabled={loading}
          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          title="Rechazar"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleAction('accept')}
          disabled={loading}
          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          title="Aceptar"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}