//book-club-frontend/src/components/social/FriendCard
// src/components/social/FriendCard.jsx
'use client';

import { MessageCircle, UserMinus, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function FriendCard({ friendship, onRemove }) {
  const router = useRouter();
  
  // Protección: Si friendship o profile son null, no renderizamos nada para evitar errores
  if (!friendship || !friendship.profile) return null;

  const user = friendship.profile;
  const friendshipId = friendship.friendshipId;

  const fullName = [user.nombre, user.apellido].filter(Boolean).join(' ') || user.username;
  const avatarUrl = user.avatarUrl || '/avatars/avatar_01.png';

  const handleRemove = async () => {
    if (!confirm(`¿Seguro que quieres eliminar a ${user.username} de tus amigos?`)) return;

    try {
      await api.delete(`/api/social/friends/${friendshipId}`);
      toast.success('Amigo eliminado');
      if (onRemove) onRemove(friendshipId);
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar amigo');
    }
  };

  const handleChat = () => {
    router.push(`/chat?userId=${user.userId}`);
  };

  return (
    <div className="card-vintage flex items-center gap-4 hover:shadow-book transition-all group">
      {/* Avatar */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-200 border-2 border-white shadow-sm">
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-full h-full object-cover"
            onError={(e) => e.target.src = '/avatars/avatar_01.png'}
          />
        </div>
        {/* Indicador (simulado por ahora) */}
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" title="En línea"></div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-heading text-lg truncate text-neutral-900">{fullName}</h3>
        <p className="text-sm text-neutral-600 font-ui">@{user.username}</p>
        
        <div className="flex items-center gap-1 mt-1 text-xs text-neutral-400">
          <Calendar className="w-3 h-3" />
          <span>Amigos desde {new Date(friendship.friendsSince || Date.now()).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          onClick={handleChat}
          className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
          title="Enviar mensaje"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleRemove}
          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
          title="Eliminar amigo"
        >
          <UserMinus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}