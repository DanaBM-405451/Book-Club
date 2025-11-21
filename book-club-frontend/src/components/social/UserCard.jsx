// src/components/social/UserCard.jsx
'use client';

import { UserPlus, Check, X } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function UserCard({ user, onUpdate, showActions = true }) {
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    try {
      setLoading(true);
      await api.post('/friends/request', {
        friendId: user.userId,
      });
      toast.success('Solicitud enviada');
      onUpdate?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = () => {
    if (user.avatarUrl) return user.avatarUrl;
    return '/avatars/avatar_01.png';
  };

  const fullName = [user.nombre, user.apellido].filter(Boolean).join(' ') || user.username;

  return (
    <div className="card-vintage flex items-center gap-4 hover:shadow-book transition-shadow">
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
        <h3 className="font-heading text-lg truncate">{fullName}</h3>
        <p className="text-sm text-neutral-600 font-ui">@{user.username}</p>
        {user.bio && (
          <p className="text-sm text-neutral-500 font-ui line-clamp-2 mt-1">{user.bio}</p>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <button
          onClick={handleSendRequest}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Agregar
        </button>
      )}
    </div>
  );
}