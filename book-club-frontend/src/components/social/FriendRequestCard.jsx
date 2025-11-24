// src/components/social/FriendRequestCard.jsx
'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function FriendRequestCard({ request, onUpdate }) {
  const [loading, setLoading] = useState(false);

  // IMPORTANTE: Asegúrate de que tu backend devuelva el ID de la solicitud como 'id' o 'friendshipId'
  // Ajusta request.id o request.friendshipId según tu backend response.
  const requestId = request.id || request.friendshipId; 

  const handleAccept = async () => {
    try {
      setLoading(true);
      // CORRECCIÓN: Ruta completa según tu Postman
      await api.post(`/api/social/friends/${requestId}/accept`);
      toast.success('¡Solicitud aceptada!');
      onUpdate?.(); // Recargar lista padre
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error al aceptar');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      // CORRECCIÓN: Ruta completa según tu Postman
      await api.post(`/api/social/friends/${requestId}/reject`);
      toast.success('Solicitud rechazada');
      onUpdate?.(); // Recargar lista padre
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error al rechazar');
    } finally {
      setLoading(false);
    }
  };

  // Manejo defensivo por si el user viene null
  const user = request.user || request.sender || {}; // Ajusta 'sender' si tu backend lo devuelve así
  
  const getAvatarUrl = () => {
    if (user.avatarUrl) return user.avatarUrl;
    return '/avatars/avatar_01.png';
  };

  const fullName = [user.nombre, user.apellido].filter(Boolean).join(' ') || user.username || 'Usuario desconocido';

  return (
    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4 mb-4">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-200 flex-shrink-0 border border-neutral-100">
        <img
          src={getAvatarUrl()}
          alt={fullName}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = '/avatars/avatar_01.png'; }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-heading text-lg text-neutral-900">{fullName}</h3>
        <p className="text-sm text-neutral-600 font-ui">@{user.username}</p>
        <p className="text-xs text-neutral-500 font-ui mt-1">
          Solicitado el: {new Date(request.createdAt || request.requestedAt).toLocaleDateString('es-ES', {
            day: 'numeric', month: 'long'
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          title="Aceptar"
        >
          {loading ? <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full"/> : <Check className="w-5 h-5" />}
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          title="Rechazar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}