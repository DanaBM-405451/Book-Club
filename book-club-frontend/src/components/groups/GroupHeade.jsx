// src/components/groups/GroupHeader.jsx
'use client';

import { useState } from 'react';
import { Users, Lock, Globe, Settings, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import InviteModal from '@/components/common/InviteModal';

export default function GroupHeader({ group, onUpdate }) {
  const router = useRouter();
  const isAdmin = group.userMembership?.role === 'ADMIN';
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Asumimos que userMembership existe si es miembro
  const canInvite = !!group.userMembership;

  return (
    <div className="card-vintage mb-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        
        {/* Info del grupo */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-heading text-neutral-900">{group.name}</h1>
            {group.isPublic ? (
              <div className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full uppercase tracking-wider">
                <Globe className="w-3 h-3" /> Público
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full uppercase tracking-wider">
                <Lock className="w-3 h-3" /> Privado
              </div>
            )}
          </div>

          {group.description && (
            <p className="text-neutral-600 font-ui mb-4 leading-relaxed">{group.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-neutral-500 font-ui">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{group.membersCount} / {group.maxMembers} miembros</span>
            </div>
            {group.creator && (
              <div>Creado por <span className="font-medium text-neutral-800">{group.creator.username}</span></div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 self-start">
          
          {/* BOTÓN INVITAR */}
          {canInvite && (
            <button 
              onClick={() => setShowInviteModal(true)}
              className="btn-primary flex items-center gap-2 shadow-sm px-4 py-2 text-sm"
            >
              <Share2 className="w-4 h-4" /> Invitar
            </button>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <button
              onClick={() => router.push(`/groups/${group.id}/settings`)}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Configuración"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE INVITACIÓN */}
      {showInviteModal && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          type="group"
          targetId={group.id}
          title={`Invitar a "${group.name}"`}
        />
      )}
    </div>
  );
}