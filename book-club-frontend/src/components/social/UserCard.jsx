'use client';

import { useState } from 'react';
import { UserPlus, UserCheck, Clock, X, UserMinus } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function UserCard({ user, onUpdate }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Estado inicial basado en lo que devuelve el backend (o 'NONE' si no viene nada)
  const [status, setStatus] = useState(user.friendshipStatus || 'NONE');

  const handleSendRequest = async () => {
    try {
      setLoading(true);
      // Nota: Asegúrate que user.userId o user.id sea el correcto según tu backend
      await api.post('/api/social/friends/request', { friendId: user.userId || user.id });
      toast.success('Solicitud enviada');
      setStatus('PENDING_SENT'); // Actualización optimista (sin recargar)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = () => {
    if (user.avatarUrl) return user.avatarUrl;
    return '/avatars/avatar_01.png';
  };

  const fullName = [user.nombre, user.apellido].filter(Boolean).join(' ') || user.username;

  // Lógica de renderizado de botones
  const renderButton = () => {
    switch (status) {
      case 'FRIENDS':
        return (
          <div className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium border border-green-200">
            <UserCheck className="w-4 h-4" />
            Amigos
          </div>
        );
      
      case 'PENDING_SENT':
        return (
          <button disabled className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-500 rounded-lg text-sm font-medium border border-neutral-200 cursor-default">
            <Clock className="w-4 h-4" />
            Pendiente
          </button>
        );

      case 'PENDING_RECEIVED':
        return (
          <button 
            onClick={() => router.push('/notifications')} 
            className="flex items-center gap-2 px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg text-sm font-medium border border-secondary-200 hover:bg-secondary-200 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Responder
          </button>
        );

      case 'NONE':
      default:
        return (
          <button
            onClick={handleSendRequest}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Agregar
              </>
            )}
          </button>
        );
    }
  };

  return (
    <div className="card-vintage flex items-center gap-4 hover:shadow-book transition-shadow">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-200 flex-shrink-0 border-2 border-white shadow-sm">
        <img
          src={getAvatarUrl()}
          alt={fullName}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = '/avatars/avatar_01.png'; }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-heading text-lg truncate text-neutral-900">{fullName}</h3>
        <p className="text-sm text-neutral-600 font-ui">@{user.username}</p>
        {user.bio && (
          <p className="text-sm text-neutral-500 font-ui line-clamp-1 mt-1 italic">"{user.bio}"</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0">
        {renderButton()}
      </div>
    </div>
  );
}