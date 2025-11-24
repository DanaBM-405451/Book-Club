// src/app/groups/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar';
import { Users, Search, Plus, Lock, Globe, BookOpen, MessageSquare, X, LogIn, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import CreateGroupModal from '@/components/groups/CreateGroupModal'; // Asegúrate de importar el modal si lo tienes separado

export default function GroupsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('public');
  const [publicGroups, setPublicGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [myGroupIds, setMyGroupIds] = useState(new Set()); // ✅ Nuevo: Para rastrear mis IDs rápidamente
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadGroups();
  }, [isAuthenticated, activeTab]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      
      // 1. Cargar Mis Grupos
      const myGroupsRes = await api.get('/api/social/groups/my-groups');
      const rawMyGroups = myGroupsRes.data.data || myGroupsRes.data || [];
      
      // ✅ CORRECCIÓN: Desempaquetar el objeto. Si viene { membership, group }, nos quedamos con group.
      const myGroupsClean = rawMyGroups.map(item => item.group ? item.group : item);
      const myIds = new Set(myGroupsClean.map(g => g.id));
      
      setMyGroups(myGroupsClean);
      setMyGroupIds(myIds);

      // 2. Cargar Públicos
      if (activeTab === 'public') {
        const publicRes = await api.get('/api/social/groups', {
          params: { page: 1, limit: 20 },
        });
        // Filtramos para no mostrar en "Explorar" los que ya están en "Mis Grupos" (Opcional, pero queda mejor)
        const publicData = Array.isArray(publicRes.data.data) ? publicRes.data.data : [];
        setPublicGroups(publicData);
      }

    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Error al cargar los grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await api.post(`/api/social/groups/${groupId}/join`);
      toast.success('¡Te has unido al grupo!');
      loadGroups(); // Recargar para actualizar botones
    } catch (error) {
      console.error('Error joining group:', error);
      // Manejo específico del error 400 (Ya eres miembro)
      if (error.response?.status === 400) {
         toast.success('Ya eres miembro de este grupo'); // Mensaje amigable
         loadGroups(); // Recargar para corregir el botón visualmente
      } else {
         toast.error(error.response?.data?.message || 'Error al unirse al grupo');
      }
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!confirm('¿Estás seguro de salir de este grupo?')) return;
    try {
      await api.post(`/api/social/groups/${groupId}/leave`);
      toast.success('Has salido del grupo');
      loadGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Error al salir del grupo');
    }
  };

  // Filtrado
  const currentGroups = activeTab === 'public' ? publicGroups : myGroups;
  const filteredGroups = currentGroups.filter(
    (group) =>
      group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) return null;

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />

      <div className="ml-20 min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-4xl font-heading text-neutral-800">Grupos de Lectura</h1>
                    <p className="text-neutral-600 font-ui mt-2">
                      Únete a comunidades de lectores apasionados
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Crear Grupo
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => setActiveTab('public')}
                    className={`px-6 py-3 rounded-lg font-ui font-medium transition-all ${
                      activeTab === 'public' ? 'bg-primary-500 text-white shadow-md' : 'bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    Explorar Grupos
                  </button>
                  <button
                    onClick={() => setActiveTab('myGroups')}
                    className={`px-6 py-3 rounded-lg font-ui font-medium transition-all ${
                      activeTab === 'myGroups' ? 'bg-primary-500 text-white shadow-md' : 'bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    Mis Grupos ({myGroups.length})
                  </button>
                </div>

                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar grupos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-12 w-full"
                  />
                </div>
              </div>

              {/* Lista de grupos */}
              {filteredGroups.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-20 h-20 mx-auto text-neutral-300 mb-4" />
                  <h3 className="text-xl font-heading text-neutral-600 mb-2">
                    {searchQuery ? 'No se encontraron grupos' : activeTab === 'public' ? 'No hay grupos públicos' : 'No te has unido a ningún grupo'}
                  </h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.map((group) => (
                    <GroupCard
                      key={`group-${group.id}`}
                      group={group}
                      currentUserId={user?.id}
                      // ✅ Pasamos si ya es miembro basado en la lista maestra de IDs
                      isAlreadyMember={myGroupIds.has(group.id)}
                      onJoin={handleJoinGroup}
                      onLeave={handleLeaveGroup}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal (si lo tienes en un componente separado, asegúrate de importarlo) */}
      {showCreateModal && (
         <CreateGroupModal 
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)} 
            onGroupCreated={() => { 
                setShowCreateModal(false); 
                loadGroups(); 
            }} 
         />
      )}
    </>
  );
}

// Componente GroupCard Actualizado
function GroupCard({ group, currentUserId, isAlreadyMember, onJoin, onLeave }) {
  const router = useRouter();
  
  // Combinamos la verificación local del grupo con la verificación global (isAlreadyMember)
  const isMember = isAlreadyMember || group.members?.some((m) => m.userId === currentUserId);
  const isFull = group.membersCount >= group.maxMembers;
  const isCreator = group.createdBy === currentUserId;

  const handleClick = () => {
    router.push(`/groups/${group.id}`);
  };

  const handleAction = (e) => {
    e.stopPropagation();
    if (isMember) onLeave(group.id);
    else onJoin(group.id);
  };

  return (
    <div onClick={handleClick} className="card-vintage cursor-pointer hover:shadow-lg transition-all group flex flex-col h-full">
      <div className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-heading font-bold text-neutral-800 group-hover:text-primary-600 transition-colors line-clamp-1">
            {group.name}
          </h3>
          {isMember && (
             <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap">
               Miembro
             </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
           {group.isPublic ? (
             <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><Globe className="w-3 h-3"/> Público</span>
           ) : (
             <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full"><Lock className="w-3 h-3"/> Privado</span>
           )}
           <span className="flex items-center gap-1 text-xs text-neutral-500"><Users className="w-3 h-3"/> {group.membersCount}/{group.maxMembers}</span>
        </div>

        {group.description && (
          <p className="text-sm text-neutral-600 font-ui mb-4 line-clamp-2">
            {group.description}
          </p>
        )}
      </div>

      {/* Botones de Acción Inteligentes */}
      <div className="mt-auto pt-4 border-t border-neutral-100">
        {!isMember ? (
          <button
            onClick={handleAction}
            disabled={isFull}
            className={`w-full py-2 px-4 rounded-lg font-ui font-medium text-sm transition-all flex items-center justify-center gap-2
              ${isFull ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed' : 'bg-primary-500 text-white hover:bg-primary-600'}
            `}
          >
            {isFull ? 'Grupo Lleno' : <><LogIn className="w-4 h-4"/> Unirse</>}
          </button>
        ) : (
          <div className="flex gap-2">
             <button className="flex-1 py-2 px-4 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-ui font-medium text-sm flex items-center justify-center gap-2">
                Ver Grupo <ArrowRight className="w-4 h-4"/>
             </button>
             {!isCreator && (
                 <button 
                    onClick={handleAction}
                    className="py-2 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                    title="Salir del grupo"
                 >
                    <X className="w-4 h-4"/>
                 </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
}