//src/app/friends/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar';
import FriendCard from '@/components/social/FriendCard';
import { Users, Search, UserPlus, Loader2, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function FriendsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadFriends();
  }, [isAuthenticated, router]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/social/friends');
      // Aseguramos que sea un array
      setFriends(response.data.data || []);
    } catch (error) {
      console.error('Error cargando amigos:', error);
      toast.error('Error al cargar la lista de amigos');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = (friendshipId) => {
    setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
  };

  // Filtrado local para búsqueda rápida
  const filteredFriends = friends.filter((f) => {
    const user = f.profile;
    if (!user) return false;
    
    const search = searchTerm.toLowerCase();
    
    // ✅ CORRECCIÓN: Usamos (campo || '') para evitar errores si es null
    const username = user.username || ''; 
    const nombre = user.nombre || '';
    const apellido = user.apellido || '';

    return (
      username.toLowerCase().includes(search) ||
      nombre.toLowerCase().includes(search) ||
      apellido.toLowerCase().includes(search)
    );
  });

  if (!isAuthenticated) return null;

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />

      <div className="ml-20 min-h-screen bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          
          {/* Header y Acciones */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-heading text-neutral-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-primary-500" />
                Mis Amigos
                <span className="text-lg text-neutral-500 font-ui font-normal">
                  ({friends.length})
                </span>
              </h1>
              <p className="text-neutral-600 font-ui mt-1">
                Conecta y comparte lecturas con tu círculo.
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => router.push('/friends/search')}
                className="btn-outline flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Buscar nuevos
              </button>
              <button 
                onClick={() => router.push('/notifications')} // Asumiendo que ahí están las solicitudes
                className="btn-secondary flex items-center gap-2 relative"
              >
                Solicitudes
                {/* Aquí podrías poner un badge si tuvieras el contador */}
              </button>
            </div>
          </div>

          {/* Barra de Búsqueda Local */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 mb-6 flex items-center gap-3">
            <Search className="w-5 h-5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Filtrar amigos por nombre..." 
              className="flex-1 outline-none font-ui text-neutral-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lista de Amigos */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            </div>
          ) : filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <FriendCard 
                  key={friend.friendshipId} 
                  friendship={friend} 
                  onRemove={handleRemoveFriend}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-neutral-300">
              <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-xl font-heading text-neutral-700 mb-2">
                {searchTerm ? 'No se encontraron resultados' : 'Aún no tienes amigos'}
              </h3>
              <p className="text-neutral-500 font-ui mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? 'Prueba con otro nombre o revisa la ortografía.' 
                  : 'Busca a otros lectores en la comunidad para ver sus libros favoritos y chatear.'}
              </p>
              {!searchTerm && (
                <button 
                  onClick={() => router.push('/friends/search')}
                  className="btn-primary"
                >
                  Buscar Amigos
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}