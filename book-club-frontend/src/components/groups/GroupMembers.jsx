// src/components/groups/GroupMembers.jsx
'use client';

import { useState, useEffect } from 'react';
import { Users, Crown, Shield, UserMinus, UserPlus, Search } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function GroupMembers({ groupId, group }) {
  const { user } = useAuthStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = group.userMembership?.role === 'ADMIN';

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
  try {
    setLoading(true);
    const response = await api.get(`/api/social/groups/${groupId}/members`);
    setMembers(Array.isArray(response.data) ? response.data : response.data?.data || []);
  } catch (error) {
    console.error('Error loading members:', error);
    if (error.response?.status !== 404) {
      toast.error('Error al cargar los miembros');
    }
    setMembers([]); // ✅ Siempre un array vacío si falla
  } finally {
    setLoading(false);
  }
};

  const handleRemoveMember = async (userId) => {
    if (!confirm('¿Estás seguro de expulsar a este miembro?')) return;

    try {
      await api.delete(`/api/social/groups/${groupId}/members/${userId}`);
      toast.success('Miembro expulsado del grupo');
      loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.response?.data?.message || 'Error al expulsar miembro');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.put(`/api/social/groups/${groupId}/members/${userId}/role`, {
        role: newRole,
      });
      toast.success('Rol actualizado correctamente');
      loadMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Error al actualizar el rol');
    }
  };

  const handleToggleUploadPermission = async (userId, canUploadBooks) => {
    try {
      await api.put(`/api/social/groups/${groupId}/members/${userId}/permissions`, {
        canUploadBooks: !canUploadBooks,
      });
      toast.success('Permisos actualizados correctamente');
      loadMembers();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Error al actualizar permisos');
    }
  };

  const filteredMembers = members.filter((member) =>
    member.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading text-neutral-800">
            Miembros del Grupo
          </h2>
          <p className="text-sm text-neutral-600 font-ui mt-1">
            {members.length} / {group.maxMembers} miembros
          </p>
        </div>

        {/* Barra de búsqueda */}
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

      {/* Lista de miembros */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <p className="text-neutral-500 font-ui">
            {searchQuery ? 'No se encontraron miembros' : 'No hay miembros en el grupo'}
          </p>
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

// Componente MemberCard
function MemberCard({
  member,
  groupId,
  currentUserId,
  isAdmin,
  onRemove,
  onUpdateRole,
  onTogglePermission,
}) {
  const [showActions, setShowActions] = useState(false);
  const isCurrentUser = member.userId === currentUserId;
  const isMemberAdmin = member.role === 'ADMIN';

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-heading font-bold">
          <Crown className="w-3 h-3" />
          Admin
        </div>
      );
    }
    if (role === 'MODERATOR') {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-heading font-bold">
          <Shield className="w-3 h-3" />
          Moderador
        </div>
      );
    }
    return (
      <div className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-heading">
        Miembro
      </div>
    );
  };

  return (
    <div className="card-vintage">
      <div className="flex items-center justify-between">
        {/* Info del miembro */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-600 font-heading font-bold text-lg">
              {member.username?.[0]?.toUpperCase() || '?'}
            </span>
          </div>

          {/* Datos */}
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-heading font-medium text-neutral-800">
                {member.username || 'Usuario'}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-neutral-500 font-ui">(Tú)</span>
                )}
              </h3>
              {getRoleBadge(member.role)}
            </div>

            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-neutral-600 font-ui">
                Miembro desde{' '}
                {new Date(member.joinedAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>

              {member.canUploadBooks && (
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  ✓ Puede subir libros
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Acciones (solo para admins) */}
        {isAdmin && !isCurrentUser && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-neutral-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            {showActions && (
              <>
                {/* Overlay para cerrar */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-20">
                  {/* Cambiar rol */}
                  {!isMemberAdmin && (
                    <>
                      <button
                        onClick={() => {
                          onUpdateRole(member.userId, 'MODERATOR');
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 font-ui flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Hacer moderador
                      </button>
                      <button
                        onClick={() => {
                          onUpdateRole(member.userId, 'ADMIN');
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 font-ui flex items-center gap-2"
                      >
                        <Crown className="w-4 h-4" />
                        Hacer admin
                      </button>
                    </>
                  )}

                  {member.role === 'MODERATOR' && (
                    <button
                      onClick={() => {
                        onUpdateRole(member.userId, 'MEMBER');
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 font-ui flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Quitar moderador
                    </button>
                  )}

                  {/* Toggle permisos */}
                  <button
                    onClick={() => {
                      onTogglePermission(member.userId, member.canUploadBooks);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 font-ui flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {member.canUploadBooks
                      ? 'Quitar permiso de subir libros'
                      : 'Dar permiso de subir libros'}
                  </button>

                  {/* Expulsar */}
                  {!isMemberAdmin && (
                    <>
                      <div className="border-t border-neutral-200 my-2" />
                      <button
                        onClick={() => {
                          onRemove(member.userId);
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 font-ui flex items-center gap-2"
                      >
                        <UserMinus className="w-4 h-4" />
                        Expulsar del grupo
                      </button>
                    </>
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