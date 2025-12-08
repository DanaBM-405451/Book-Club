// src/components/groups/GroupMembers.jsx
'use client';

import { useState, useEffect } from 'react';
import { Users, Crown, Shield, UserMinus, UserPlus, Search, UserCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function GroupMembers({ groupId, group }) {
  const { user } = useAuthStore();
  const [members, setMembers] = useState([]);
  const [friendsIds, setFriendsIds] = useState(new Set()); // Para saber quién es mi amigo
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = group.userMembership?.role === 'ADMIN';

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Cargar miembros del grupo
      const membersRes = await api.get(`/api/social/groups/${groupId}/members`);
      const membersData = Array.isArray(membersRes.data) ? membersRes.data : membersRes.data?.data || [];
      setMembers(membersData);

      // 2. Cargar mis amigos (para saber si mostrar botón de agregar)
      try {
        const friendsRes = await api.get('/api/social/friends');
        const myFriends = friendsRes.data.data || [];
        // Guardamos los IDs en un Set para búsqueda rápida
        const ids = new Set(myFriends.map(f => f.profile?.userId));
        setFriendsIds(ids);
      } catch (e) {
        console.warn("No se pudieron cargar amigos", e);
      }

    } catch (error) {
      console.error('Error loading members:', error);
      if (error.response?.status !== 404) toast.error('Error al cargar miembros');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (targetUserId) => {
    try {
      await api.post('/api/social/friends/request', { friendId: targetUserId });
      toast.success('Solicitud de amistad enviada');
      // Opcional: Podríamos agregarlo a un estado local de "solicitudes enviadas" para deshabilitar el botón
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar solicitud');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('¿Estás seguro de expulsar a este miembro?')) return;
    try {
      await api.delete(`/api/social/groups/${groupId}/members/${userId}`);
      toast.success('Miembro expulsado');
      loadData(); // Recargar lista
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al expulsar');
    }
  };

  // ... (handleUpdateRole y handleToggleUploadPermission se mantienen igual) ...
  const handleUpdateRole = async (userId, newRole) => {
    try {
        await api.put(`/api/social/groups/${groupId}/members/${userId}/role`, { role: newRole });
        toast.success('Rol actualizado');
        loadData();
    } catch (error) { toast.error('Error al actualizar rol'); }
  };

  const handleToggleUploadPermission = async (userId, canUploadBooks) => {
    try {
        await api.put(`/api/social/groups/${groupId}/members/${userId}/permissions`, { canUploadBooks: !canUploadBooks });
        toast.success('Permisos actualizados');
        loadData();
    } catch (error) { toast.error('Error al actualizar permisos'); }
  };

  const filteredMembers = members.filter((member) =>
    member.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-heading text-neutral-800">Miembros del Grupo</h2>
          <p className="text-sm text-neutral-600 font-ui mt-1">{members.length} / {group.maxMembers} miembros</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar miembros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-64"
          />
        </div>
      </div>

      {/* Lista */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <p className="text-neutral-500 font-ui">No se encontraron miembros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.userId}
              member={member}
              groupId={groupId}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              isFriend={friendsIds.has(member.userId)} // Pasamos si ya es amigo
              onAddFriend={handleAddFriend} // Pasamos la función
              onRemove={handleRemoveMember}
              onUpdateRole={handleUpdateRole}
              onTogglePermission={handleToggleUploadPermission}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberCard({ member, currentUserId, isAdmin, isFriend, onAddFriend, onRemove, onUpdateRole, onTogglePermission }) {
  const [showActions, setShowActions] = useState(false);
  const isCurrentUser = member.userId === currentUserId;
  const isMemberAdmin = member.role === 'ADMIN';

  // Badges de Rol (igual que antes)
  const getRoleBadge = (role) => {
    if (role === 'ADMIN') return <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold"><Crown className="w-3 h-3" /> Admin</div>;
    if (role === 'MODERATOR') return <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold"><Shield className="w-3 h-3" /> Moderador</div>;
    return <div className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs">Miembro</div>;
  };

  return (
    <div className="card-vintage flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      
      {/* Info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span className="text-primary-600 font-heading font-bold text-lg">{member.username?.[0]?.toUpperCase()}</span>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-neutral-800">{member.username} {isCurrentUser && <span className="text-neutral-400 text-xs">(Tú)</span>}</h3>
            {getRoleBadge(member.role)}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
             Unido el {new Date(member.joinedAt).toLocaleDateString()}
             {member.canUploadBooks && <span className="ml-2 text-green-600">✓ Puede subir libros</span>}
          </p>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        
        {/* ✅ BOTÓN AGREGAR AMIGO */}
        {!isCurrentUser && !isFriend && (
            <button 
                onClick={() => onAddFriend(member.userId)}
                className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200"
                title="Enviar solicitud de amistad"
            >
                <UserPlus className="w-4 h-4" /> Agregar
            </button>
        )}
        
        {/* Indicador si ya son amigos */}
        {!isCurrentUser && isFriend && (
            <span className="px-3 py-1.5 text-xs text-green-600 bg-green-50 rounded-lg flex items-center gap-1 cursor-default">
                <UserCheck className="w-4 h-4" /> Amigos
            </span>
        )}

        {/* Acciones Admin (Solo si soy admin y no soy yo) */}
        {isAdmin && !isCurrentUser && (
          <div className="relative">
            <button onClick={() => setShowActions(!showActions)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-20">
                  {/* ... (Menú de admin igual que antes) ... */}
                  {!isMemberAdmin && (
                    <>
                       <button onClick={() => { onUpdateRole(member.userId, 'MODERATOR'); setShowActions(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"><Shield className="w-4 h-4"/> Hacer moderador</button>
                       <button onClick={() => { onUpdateRole(member.userId, 'ADMIN'); setShowActions(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"><Crown className="w-4 h-4"/> Hacer admin</button>
                    </>
                  )}
                  {member.role === 'MODERATOR' && (
                     <button onClick={() => { onUpdateRole(member.userId, 'MEMBER'); setShowActions(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"><Users className="w-4 h-4"/> Quitar moderador</button>
                  )}
                  <button onClick={() => { onTogglePermission(member.userId, member.canUploadBooks); setShowActions(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"><UserPlus className="w-4 h-4"/> {member.canUploadBooks ? 'Quitar permiso subida' : 'Dar permiso subida'}</button>
                  {!isMemberAdmin && (
                     <button onClick={() => { onRemove(member.userId); setShowActions(false); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t mt-1"><UserMinus className="w-4 h-4"/> Expulsar</button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}