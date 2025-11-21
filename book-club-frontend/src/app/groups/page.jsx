// src/app/groups/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import { Users, Plus } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function GroupsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  const handleGroupCreated = () => {
    // Aquí cargarías la lista de grupos cuando esté implementado
    console.log('Grupo creado');
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />

      <div className="ml-20 min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-secondary-100 p-3 rounded-xl">
                <Users className="w-8 h-8 text-secondary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-heading">Grupos de Lectura</h1>
                <p className="text-neutral-600 font-ui">Únete o crea grupos para leer juntos</p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Grupo
            </button>
          </div>

          {/* Placeholder */}
          <div className="card-vintage text-center py-16">
            <Users className="w-20 h-20 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-neutral-700 mb-2">
              Próximamente
            </h2>
            <p className="text-neutral-500 font-ui mb-6">
              La funcionalidad de grupos de lectura estará disponible pronto
            </p>
          </div>
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </>
  );
}