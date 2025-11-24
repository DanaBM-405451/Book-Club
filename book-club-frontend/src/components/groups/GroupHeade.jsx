// src/components/groups/GroupHeader.jsx
'use client';

import { Users, Lock, Globe, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GroupHeader({ group, onUpdate }) {
  const router = useRouter();
  const isAdmin = group.userMembership?.role === 'ADMIN';

  return (
    <div className="card-vintage">
      <div className="flex items-start justify-between">
        {/* Info del grupo */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-heading">{group.name}</h1>
            {group.isPublic ? (
              <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <Globe className="w-4 h-4" />
                Público
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                <Lock className="w-4 h-4" />
                Privado
              </div>
            )}
          </div>

          {group.description && (
            <p className="text-neutral-600 font-ui mb-4">{group.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-neutral-600 font-ui">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>
                {group.membersCount} / {group.maxMembers} miembros
              </span>
            </div>
            {group.creator && (
              <div>
                Creado por <span className="font-medium">{group.creator.username}</span>
              </div>
            )}
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <button
            onClick={() => router.push(`/groups/${group.id}/settings`)}
            className="btn-outline flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Configuración
          </button>
        )}
      </div>
    </div>
  );
}