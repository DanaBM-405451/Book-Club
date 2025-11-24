'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, BookOpen, Edit2, Trash2, Eye, Star, Tag, StarHalf, FileText, Clock, Calendar,
} from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import EditBookModal from '@/components/books/EditBookModal';

// Componente especial para Estrellas con medios puntos
const StarRating = ({ rating, onRating, readOnly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  // Maneja el movimiento del mouse para detectar mitad izquierda/derecha
  const handleMouseMove = (e, starIndex) => {
    if (readOnly) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - left) / width;
    // Si está en el 50% izquierdo es .5, si no es entero
    const newRating = percent < 0.5 ? starIndex - 0.5 : starIndex;
    setHoverRating(newRating);
  };

  const handleClick = () => {
    if (!readOnly && onRating) onRating(hoverRating);
  };

  const displayRating = hoverRating || rating || 0;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        // Lógica de visualización
        const isFull = displayRating >= star;
        const isHalf = displayRating >= star - 0.5 && displayRating < star;

        return (
          <div
            key={star}
            className={`relative cursor-pointer transition-transform ${!readOnly && 'hover:scale-110'}`}
            onMouseMove={(e) => handleMouseMove(e, star)}
            onClick={handleClick}
          >
            {/* Estrella base (Gris) */}
            <Star className="w-8 h-8 text-neutral-300" />
            
            {/* Estrella Media (Oro, recortada) */}
            {isHalf && (
              <div className="absolute top-0 left-0 overflow-hidden w-[50%]">
                 <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              </div>
            )}

            {/* Estrella Completa (Oro) */}
            {isFull && (
              <div className="absolute top-0 left-0">
                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              </div>
            )}
          </div>
        );
      })}
      
      {/* Texto de puntuación */}
      <span className="ml-2 text-xl font-bold text-neutral-700 font-ui min-w-[2rem]">
        {displayRating > 0 ? displayRating : ''}
      </span>
    </div>
  );
};

export default function BookDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [book, setBook] = useState(null);
  const [userBook, setUserBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadBookDetails();
  }, [params.id, isAuthenticated]);

  const loadBookDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/library/books/${params.id}`);
      const data = response.data.data;
      setBook(data.userBook.book);
      setUserBook(data.userBook);
    } catch (error) {
      console.error('Error loading book:', error);
      toast.error('Error al cargar el libro');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRead = () => {
    if (book.pdfFileUrl || book.epubFileUrl) {
      router.push(`/reader/${params.id}`);
    } else {
      toast.error('Este libro no tiene archivo para leer');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este libro?')) return;
    try {
      await api.delete(`/api/library/books/${params.id}`);
      toast.success('Libro eliminado');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Error al eliminar el libro');
    }
  };

  const handleRating = async (rating) => {
    try {
      await api.put(`/api/library/books/${params.id}/rating`, { rating });
      toast.success(`Calificación guardada: ${rating}`);
      // Actualizamos estado localmente para feedback inmediato
      setUserBook(prev => ({ ...prev, rating }));
    } catch (error) {
      toast.error('Error al guardar calificación');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-neutral-600 font-ui">Cargando libro...</p>
        </div>
      </div>
    );
  }

  if (!book) return null;

  return (
    <>
      <Toaster position="top-center" />

      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="bg-white shadow-card border-b border-neutral-200">
          <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-ui">Volver a la biblioteca</span>
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Portada */}
            <div className="md:col-span-1">
              <div className="sticky top-8">
                <div className="aspect-[2/3] bg-neutral-200 rounded-lg overflow-hidden shadow-book relative group">
                  {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} alt={book.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-200 to-secondary-200">
                      <BookOpen className="w-20 h-20 text-white" />
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="mt-4 space-y-2">
                  <button onClick={handleRead} disabled={!book.pdfFileUrl && !book.epubFileUrl} className="btn-primary w-full justify-center">
                    <Eye className="w-5 h-5 mr-2" /> Leer
                  </button>
                  <button onClick={() => setIsEditModalOpen(true)} className="btn-outline w-full justify-center">
                    <Edit2 className="w-5 h-5 mr-2" /> Editar
                  </button>
                  <button onClick={handleDelete} className="w-full justify-center px-6 py-3 font-ui font-medium rounded-lg border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-5 h-5 mr-2 inline" /> Eliminar
                  </button>
                </div>
              </div>
            </div>

            {/* Detalles */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-4xl font-heading mb-2 text-neutral-900">{book.titulo}</h1>
                {book.subtitulo && <h2 className="text-2xl font-heading text-neutral-600 mb-4">{book.subtitulo}</h2>}
                <p className="text-xl text-neutral-700 font-ui">{book.autor}</p>
              </div>

              {/* Calificación con Medias Estrellas */}
              <div className="py-2">
                 <p className="text-sm text-neutral-500 font-ui mb-1">Tu calificación</p>
                 <StarRating 
                    rating={userBook?.rating || 0} 
                    onRating={handleRating} 
                 />
              </div>

              {/* Progreso ROBUSTO */}
              {userBook && (
                <div className="card-vintage">
                  <h3 className="text-lg font-heading mb-3">Progreso de lectura</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm font-ui mb-1 text-neutral-700">
                        {/* Usamos || 0 para evitar errores si viene null */}
                        <span className="font-bold">
                          {userBook.currentPage || 0} / {userBook.totalPages || '?'} páginas
                        </span>
                        <span className="font-bold text-primary-600">
                           {userBook.progressPercent ? parseFloat(userBook.progressPercent).toFixed(0) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-primary-500 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${userBook.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-neutral-600 font-ui">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{userBook.totalReadingTimeMinutes || 0} min leídos</span>
                      </div>
                      {userBook.lastReadAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Última vez: {new Date(userBook.lastReadAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Descripción */}
              {book.descripcion && (
                <div className="card-vintage">
                  <h3 className="text-lg font-heading mb-3">Descripción</h3>
                  <p className="text-neutral-700 font-ui leading-relaxed">{book.descripcion}</p>
                </div>
              )}

              {/* Información del libro */}
              <div className="card-vintage">
                <h3 className="text-lg font-heading mb-4">Información</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {book.publicacion && <div><p className="text-sm text-neutral-500 font-ui">Editorial</p><p className="text-neutral-900 font-ui">{book.publicacion}</p></div>}
                  {book.fechaPublicacion && <div><p className="text-sm text-neutral-500 font-ui">Fecha</p><p className="text-neutral-900 font-ui">{book.fechaPublicacion}</p></div>}
                  {book.pageCount && <div><p className="text-sm text-neutral-500 font-ui">Páginas</p><p className="text-neutral-900 font-ui">{book.pageCount}</p></div>}
                  {book.idioma && <div><p className="text-sm text-neutral-500 font-ui">Idioma</p><p className="text-neutral-900 font-ui uppercase">{book.idioma}</p></div>}
                  {book.isbn13 && <div><p className="text-sm text-neutral-500 font-ui">ISBN-13</p><p className="text-neutral-900 font-ui font-mono text-sm">{book.isbn13}</p></div>}
                </div>

                {/* Categorías y Tags */}
                {(book.categorias || userBook?.tags) && (
                   <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
                      {book.categorias && (
                        <div>
                          <p className="text-xs text-neutral-400 font-ui uppercase tracking-wider mb-2">Géneros</p>
                          <div className="flex flex-wrap gap-2">
                            {book.categorias.split(',').map((cat, idx) => (
                              <span key={idx} className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-medium border border-neutral-200">
                                {cat.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {userBook?.tags && (
                        <div>
                          <p className="text-xs text-neutral-400 font-ui uppercase tracking-wider mb-2">Mis Etiquetas</p>
                          <div className="flex flex-wrap gap-2">
                            {userBook.tags.split(',').map((tag, idx) => (
                              <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium border border-primary-100 flex items-center gap-1">
                                <Tag className="w-3 h-3" /> {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                   </div>
                )}
              </div>

              {/* Archivos */}
              <div className="card-vintage">
                <h3 className="text-lg font-heading mb-3">Archivos</h3>
                <div className="flex gap-4">
                  {book.pdfFileUrl && <div className="flex items-center gap-2 text-sm text-neutral-700"><FileText className="w-4 h-4 text-red-500" /> PDF</div>}
                  {book.epubFileUrl && <div className="flex items-center gap-2 text-sm text-neutral-700"><BookOpen className="w-4 h-4 text-green-500" /> EPUB</div>}
                  {!book.pdfFileUrl && !book.epubFileUrl && <p className="text-neutral-400 text-sm">Sin archivos.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditBookModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} book={book} userBook={userBook} onBookUpdated={loadBookDetails} />
    </>
  );
}