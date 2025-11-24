// src/app/groups/[id]/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar';
import GroupHeader from '@/components/groups/GroupHeade'; 
import GroupForum from '@/components/groups/GroupForum';
import GroupMembers from '@/components/groups/GroupMembers';
import GroupProposals from '@/components/groups/GroupProposals';
import GroupGoals from '@/components/groups/GroupGoals';
import GroupChallenges from '@/components/groups/GroupChallenges';
import { MessageSquare, Users, BookOpen, Target, Trophy, Lock } from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = parseInt(params.id);
  const { isAuthenticated, user } = useAuthStore();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('forum');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, groupId]);

  const loadGroup = async () => {
    try {
      if (!group) setLoading(true);
      
      const response = await api.get(`/api/social/groups/${groupId}`);
      
      // ✅ CORRECCIÓN CRÍTICA:
      // El backend devuelve { success: true, data: { ...grupo } }
      // Debemos guardar response.data.data, no response.data completo.
      setGroup(response.data.data || response.data);

    } catch (error) {
      console.error('Error loading group:', error);
      if (error.response?.status === 403) {
         toast.error('Este grupo es privado. Debes unirte primero.');
         router.push('/groups');
      } else {
         toast.error('Error al cargar el grupo');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
      try {
          await api.post(`/api/social/groups/${groupId}/join`);
          toast.success('¡Te has unido!');
          loadGroup(); 
      } catch (e) {
          if (e.response?.status === 400) {
             // Si ya es miembro, recargamos para que la UI se entere
             loadGroup();
          }
          toast.error(e.response?.data?.message || 'Error al unirse');
      }
  };

  if (!isAuthenticated) return null;

  // Loader nativo (Sin componente externo que cause error)
  if (loading && !group) {
    return (
      <>
        <Navbar />
        <div className="ml-20 min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </>
    );
  }

  if (!group) return null;

  // ✅ Verificación de Membresía (Ahora funcionará porque 'group' tiene la estructura correcta)
  const isMember = 
    (group.userMembership !== null && group.userMembership !== undefined) || 
    (user && group.members?.some(m => String(m.userId) === String(user.id)));

  const tabs = [
    { id: 'forum', label: 'Foro', icon: MessageSquare, count: group.postsCount },
    { id: 'members', label: 'Miembros', icon: Users, count: group.membersCount },
    { id: 'proposals', label: 'Propuestas', icon: BookOpen, count: group.proposalsCount },
    { id: 'goals', label: 'Metas', icon: Target, count: group.goalsCount },
    { id: 'challenges', label: 'Retos', icon: Trophy },
  ];

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />

      <div className="ml-20 min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          
          <GroupHeader group={group} onUpdate={loadGroup} />

          {/* BANNER NO MIEMBRO */}
          {!isMember && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                          <Lock className="w-5 h-5" />
                      </div>
                      <div>
                          <h3 className="font-bold text-blue-900 text-lg">Estás en modo espectador</h3>
                          <p className="text-blue-700 text-sm">Únete al grupo para publicar, votar y participar en los retos.</p>
                      </div>
                  </div>
                  <button onClick={handleJoin} className="btn-primary px-6 py-2 shadow-md hover:shadow-lg transition-all">
                      Unirse al Grupo
                  </button>
              </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-card mt-6 min-h-[500px]">
            <div className="border-b border-neutral-200">
              <nav className="flex space-x-8 px-6 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 py-4 px-1 border-b-2 font-ui font-medium text-sm transition-colors whitespace-nowrap
                        ${isActive ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-bold ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'}`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'forum' && <GroupForum groupId={groupId} group={group} isMember={isMember} />}
              {activeTab === 'members' && <GroupMembers groupId={groupId} group={group} isMember={isMember} />}
              {activeTab === 'proposals' && <GroupProposals groupId={groupId} group={group} isMember={isMember} onUpdate={loadGroup} />}
              {activeTab === 'goals' && <GroupGoals groupId={groupId} group={group} isMember={isMember} />}
              {activeTab === 'challenges' && <GroupChallenges groupId={groupId} group={group} isMember={isMember} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}