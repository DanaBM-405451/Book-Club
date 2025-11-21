// src/app/friends/search/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar';
import UserCard from '@/components/social/UserCard';
import { Search, Users } from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function SearchFriendsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      toast.error('Ingresa un nombre o usuario para buscar');
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      const response = await api.get(`/api/users/search`, {
        params: {
          q: searchQuery,
          page: 1,
          limit: 20,
        },
      });
      setResults(response.data.data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Error al buscar usuarios');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />

      <div className="ml-20 min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary-100 p-3 rounded-xl">
                <Search className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-heading">Buscar Amigos</h1>
                <p className="text-neutral-600 font-ui">Encuentra lectores y envía solicitudes</p>
              </div>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o usuario..."
                className="flex-1 input-field"
              />
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Buscar
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              <p className="mt-4 text-neutral-600 font-ui">Buscando usuarios...</p>
            </div>
          ) : searched && results.length === 0 ? (
            <div className="card-vintage text-center py-12">
              <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-xl font-heading text-neutral-700 mb-2">
                No se encontraron usuarios
              </h2>
              <p className="text-neutral-500 font-ui">
                Intenta con otro término de búsqueda
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((user) => (
                <UserCard key={user.id} user={user} onUpdate={handleSearch} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}