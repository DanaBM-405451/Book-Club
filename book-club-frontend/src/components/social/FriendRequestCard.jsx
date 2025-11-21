// src/components/social/FriendRequestCard.jsx
'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function FriendRequestCard({ request, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);
      await api.post(`/friends/${request.id}/accept`);
      toast.success('¡Solicitud aceptada!');
      onUpdate?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al aceptar');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await api.post(`/friends/${request.id}/reject`);
      toast.success('Solicitud rechazada');
      onUpdate?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al rechazar');
    } finally {
      setLoading(false);
    }
  };

  const user = request.user;
  if (!user) return null;

  const getAvatarUrl = () => {
    if (user.avatarUrl) return user.avatarUrl;
    return '/avatars/avatar_01.png';
  };

  const fullName = [user.nombre, user.apellido].filter(Boolean).join(' ') || user.username;

  return (
    <div className="card-vintage flex items-center gap-4">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-200 flex-shrink-0">
        <img
          src={getAvatarUrl()}
          alt={fullName}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = '/avatars/avatar_01.png';
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-heading text-lg">{fullName}</h3>
        <p className="text-sm text-neutral-600 font-ui">@{user.username}</p>
        <p className="text-xs text-neutral-500 font-ui mt-1">
          {new Date(request.requestedAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
          title="Aceptar"
        >
          <Check className="w-5 h-5" />
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="p-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
          title="Rechazar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}