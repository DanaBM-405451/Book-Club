// src/app/dashboard/page.jsx

'use client';
import AddBookModal from '@/components/books/AddBookModal';
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
  CheckCircle, // ✅ Icono para libros completados
  Loader2 
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

      // Cargar libros y estadísticas en paralelo
      const [booksRes, statsRes] = await Promise.allSettled([
        api.get('/api/library/books'),
        api.get('/api/gamification/stats')
      ]);

      // Procesar libros
      if (booksRes.status === 'fulfilled') {
        setBooks(booksRes.value.data.data?.userBooks || []);
      } else {
        console.error('Error loading books:', booksRes.reason);
        // No mostramos toast de error si es 404 (simplemente no hay libros)
        if (booksRes.reason.response?.status !== 404) {
           toast.error('Error al cargar biblioteca');
        }
      }

      // Procesar estadísticas
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data?.stats || null);
      } else {
        console.error('Error loading stats:', statsRes.reason);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter((userBook) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      userBook.book?.titulo?.toLowerCase().includes(searchLower) ||
      userBook.book?.autor?.toLowerCase().includes(searchLower)
    );
  });

  if (!isAuthenticated) return null;

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />
  
      <div className="ml-20 min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="bg-white shadow-card border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary-500 p-2 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-heading">Book Club</h1>
              </div>

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
              <div className="card-vintage bg-gradient-to-br from-gold-50 to-gold-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-ui text-neutral-600">XP Total</p>
                    <p className="text-3xl font-heading font-bold text-gold-700">{stats.totalXP || 0}</p>
                  </div>
                  <Trophy className="w-12 h-12 text-gold-500" />
                </div>
              </div>

              <div className="card-vintage bg-gradient-to-br from-primary-50 to-primary-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-ui text-neutral-600">Nivel</p>
                    <p className="text-3xl font-heading font-bold text-primary-700">{stats.currentLevel || 1}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-heading text-xl">
                    {stats.currentLevel || 1}
                  </div>
                </div>
              </div>

              <div className="card-vintage bg-gradient-to-br from-secondary-50 to-secondary-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-ui text-neutral-600">Libros Leídos</p>
                    <p className="text-3xl font-heading font-bold text-secondary-700">{stats.totalBooksRead || 0}</p>
                  </div>
                  <BookOpen className="w-12 h-12 text-secondary-500" />
                </div>
              </div>

              <div className="card-vintage bg-gradient-to-br from-accent-50 to-accent-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-ui text-neutral-600">Racha</p>
                    <p className="text-3xl font-heading font-bold text-accent-700">{stats.currentStreak || 0} días</p>
                  </div>
                  <Flame className="w-12 h-12 text-accent-500" />
                </div>
              </div>
            </div>
          )}

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
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-lg font-ui text-neutral-600 mb-2">
                  {searchTerm ? 'No se encontraron libros con ese criterio' : 'Aún no tienes libros en tu biblioteca'}
                </p>
                {!searchTerm && (
                  <button onClick={() => setIsAddBookModalOpen(true)} className="btn-primary mt-4">
                    Agregar Primer Libro
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredBooks.map((userBook) => {
                  const isCompleted = userBook.status === 'COMPLETADO';
                  const progress = isCompleted ? 100 : userBook.progressPercent || 0;
                  
                  return (
                    <div
                      key={userBook.id}
                      className={`group cursor-pointer relative rounded-lg overflow-hidden transition-all hover:shadow-book ${
                        isCompleted ? 'ring-2 ring-gold-400' : ''
                      }`}
                      onClick={() => router.push(`/book/${userBook.bookId}`)}
                    >
                      {/* Portada */}
                      <div className="relative aspect-[2/3] bg-neutral-200 overflow-hidden">
                        {userBook.book?.coverImageUrl ? (
                          <img
                            src={userBook.book.coverImageUrl}
                            alt={userBook.book.titulo}
                            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isCompleted ? 'opacity-90' : ''}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-200 to-secondary-200">
                            <BookOpen className="w-12 h-12 text-white" />
                          </div>
                        )}

                        {/* Overlay de Completado */}
                        {isCompleted && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                            <CheckCircle className="w-12 h-12 text-white drop-shadow-lg" />
                          </div>
                        )}

                        {/* Badge de Progreso (si no está completado) */}
                        {!isCompleted && progress > 0 && (
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-ui font-medium shadow-sm">
                            {Math.round(progress)}%
                          </div>
                        )}

                        {/* Badge de Estado (Abajo) */}
                        <div className="absolute bottom-2 left-2 right-2">
                           <div className={`text-xs font-ui font-medium px-2 py-1 rounded text-center shadow-sm backdrop-blur-md ${
                             isCompleted 
                               ? 'bg-gold-500 text-white' 
                               : userBook.status === 'LEYENDO'
                               ? 'bg-secondary-500/90 text-white'
                               : 'bg-neutral-800/70 text-white'
                           }`}>
                             {isCompleted ? '¡Terminado!' : 
                              userBook.status === 'LEYENDO' ? 'Leyendo' : 
                              userBook.status === 'QUIERO_LEER' ? 'Por leer' : userBook.status}
                           </div>
                        </div>
                      </div>

                      {/* Info del libro */}
                      <div className="p-2 bg-white">
                        <h3 className="text-sm font-ui font-bold text-neutral-900 line-clamp-1" title={userBook.book?.titulo}>
                          {userBook.book?.titulo || 'Sin título'}
                        </h3>
                        <p className="text-xs text-neutral-500 line-clamp-1">
                          {userBook.book?.autor || 'Autor desconocido'}
                        </p>
                        
                        {/* Barra de progreso mini */}
                        <div className="mt-2 h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isCompleted ? 'bg-gold-500' : 'bg-primary-500'}`} 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
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