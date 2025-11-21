// src/app/dashboard/page.jsx

'use client';
import AddBookModal from '@/components/books/AddBookModal';
import BookCard from '@/components/books/BookCard';
import Navbar from '@/components/layout/Navbar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Trophy, 
  Flame, 
  LogOut, 
  User 
} from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadData();
  }, [isAuthenticated, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar libros
      try {
        const booksRes = await api.get('/api/library/books');
        setBooks(booksRes.data.data?.userBooks || []);
      } catch (error) {
        console.error('Error loading books:', error);
        if (error.response?.status !== 404) {
          toast.error('Error al cargar los libros');
        }
      }

      // Cargar estadísticas
      try {
        const statsRes = await api.get('/api/gamification/stats');
        setStats(statsRes.data.data?.stats || null);
      } catch (error) {
        console.error('Error loading stats:', error);
        // No mostrar error si las stats no existen aún
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    router.push('/login');
  };

  const filteredBooks = books.filter((userBook) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      userBook.book?.titulo?.toLowerCase().includes(searchLower) ||
      userBook.book?.autor?.toLowerCase().includes(searchLower)
    );
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Toaster position="top-center" />
  <Navbar />
  
  <div className="ml-20 min-h-screen bg-neutral-50">

      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
       <header className="bg-white shadow-card border-b border-neutral-200">
  <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="bg-primary-500 p-2 rounded-lg">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-heading">Book Club</h1>
      </div>

      {/* User info - Solo nombre y email */}
      <div className="text-right">
        <p className="text-sm font-ui font-medium text-neutral-900">
          {user?.username || 'Usuario'}
        </p>
        <p className="text-xs text-neutral-500">{user?.email || ''}</p>
      </div>
    </div>
  </div>
</header>

        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* XP Card */}
              <div className="card-vintage bg-gradient-to-br from-gold-50 to-gold-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-ui text-neutral-600">XP Total</p>
                    <p className="text-3xl font-heading font-bold text-gold-700">
                      {stats.totalXP || 0}
                    </p>
                  </div>
                  <Trophy className="w-12 h-12 text-gold-500" />
                </div>
              </div>

              {/* Level Card */}
              <div className="card-vintage bg-gradient-to-br from-primary-50 to-primary-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-ui text-neutral-600">Nivel</p>
                    <p className="text-3xl font-heading font-bold text-primary-700">
                      {stats.currentLevel || 1}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-heading text-xl">
                    {stats.currentLevel || 1}
                  </div>
                </div>
              </div>

              {/* Books Card */}
              <div className="card-vintage bg-gradient-to-br from-secondary-50 to-secondary-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-ui text-neutral-600">Libros Leídos</p>
                    <p className="text-3xl font-heading font-bold text-secondary-700">
                      {stats.totalBooksRead || 0}
                    </p>
                  </div>
                  <BookOpen className="w-12 h-12 text-secondary-500" />
                </div>
              </div>

              {/* Streak Card */}
              <div className="card-vintage bg-gradient-to-br from-accent-50 to-accent-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-ui text-neutral-600">Racha</p>
                    <p className="text-3xl font-heading font-bold text-accent-700">
                      {stats.currentStreak || 0} días
                    </p>
                  </div>
                  <Flame className="w-12 h-12 text-accent-500" />
                </div>
              </div>
            </div>
          )}
          </div>
          {/* Books Section */}
          <div className="card-vintage">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading">Mi Biblioteca</h2>
              <button 
              onClick={() => setIsAddBookModalOpen(true)} 
              className="btn-primary flex items-center gap-2"
>
<Plus className="w-5 h-5" />
  <span className="hidden sm:inline">Agregar Libro</span>
</button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar libros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <button className="btn-outline flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filtros</span>
              </button>
            </div>

            {/* Books Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
  {filteredBooks.map((userBook) => (
    <BookCard
      key={userBook.id}
      userBook={userBook}
      onUpdate={loadData}
    />
  ))}
</div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-lg font-ui text-neutral-600 mb-2">
                  {searchTerm
                    ? 'No se encontraron libros con ese criterio'
                    : 'Aún no tienes libros en tu biblioteca'}
                </p>
                <p className="text-sm text-neutral-500 mb-6">
                  {searchTerm
                    ? 'Intenta con otro término de búsqueda'
                    : 'Comienza agregando tu primer libro'}
                </p>
                {!searchTerm && (
                  <button className="btn-primary">Agregar Primer Libro</button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredBooks.map((userBook) => (
                  <div
                    key={userBook.id}
                    className="group cursor-pointer"
                    onClick={() => router.push(`/book/${userBook.bookId}`)}
                  >
                    <div className="relative aspect-[2/3] bg-neutral-200 rounded-lg overflow-hidden shadow-card group-hover:shadow-book transition-shadow">
                      {userBook.book?.coverImageUrl ? (
                        <img
                          src={userBook.book.coverImageUrl}
                          alt={userBook.book.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-200 to-secondary-200">
                          <BookOpen className="w-12 h-12 text-white" />
                        </div>
                      )}

                      {/* Progress Badge */}
                      {userBook.progressPercent > 0 && (
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-ui font-medium">
                          {Math.round(userBook.progressPercent)}%
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div
                          className={`text-xs font-ui font-medium px-2 py-1 rounded backdrop-blur-sm ${
                            userBook.status === 'LEYENDO'
                              ? 'bg-secondary-500/90 text-white'
                              : userBook.status === 'COMPLETADO'
                              ? 'bg-gold-500/90 text-white'
                              : 'bg-neutral-500/90 text-white'
                          }`}
                        >
                          {userBook.status === 'LEYENDO'
                            ? 'Leyendo'
                            : userBook.status === 'COMPLETADO'
                            ? 'Completado'
                            : userBook.status === 'QUIERO_LEER'
                            ? 'Quiero leer'
                            : userBook.status}
                        </div>
                      </div>
                    </div>

                    <h3 className="mt-2 text-sm font-ui font-medium text-neutral-900 line-clamp-2">
                      {userBook.book?.titulo || 'Sin título'}
                    </h3>
                    <p className="text-xs text-neutral-600 line-clamp-1">
                      {userBook.book?.autor || 'Autor desconocido'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <AddBookModal
  isOpen={isAddBookModalOpen}
  onClose={() => setIsAddBookModalOpen(false)}
  onBookAdded={loadData}
/>
    </>
  );
}