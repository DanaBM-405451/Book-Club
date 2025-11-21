'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Edit2,
  Trash2,
  Eye,
  Star,
  Tag,
  Globe,
  Lock,
  FileText,
  Clock,
  Calendar,
} from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import EditBookModal from '@/components/books/EditBookModal';

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
    // Verificar si tiene PDF o EPUB
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
      toast.success('Calificación guardada');
      loadBookDetails();
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
                <div className="aspect-[2/3] bg-neutral-200 rounded-lg overflow-hidden shadow-book">
                  {book.coverImageUrl ? (
                    <img
                      src={book.coverImageUrl}
                      alt={book.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-200 to-secondary-200">
                      <BookOpen className="w-20 h-20 text-white" />
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleRead}
                    className="btn-primary w-full justify-center"
                    disabled={!book.pdfFileUrl && !book.epubFileUrl}
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    Leer
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="btn-outline w-full justify-center"
                  >
                    <Edit2 className="w-5 h-5 mr-2" />
                    Editar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full justify-center px-6 py-3 font-ui font-medium rounded-lg border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 mr-2 inline" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>

            {/* Detalles */}
            <div className="md:col-span-2 space-y-6">
              {/* Título y Autor */}
              <div>
                <h1 className="text-4xl font-heading mb-2">{book.titulo}</h1>
                {book.subtitulo && (
                  <h2 className="text-2xl font-heading text-neutral-600 mb-4">
                    {book.subtitulo}
                  </h2>
                )}
                <p className="text-xl text-neutral-700 font-ui">{book.autor}</p>
              </div>

              {/* Calificación */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (userBook?.rating || 0)
                          ? 'fill-gold-500 text-gold-500'
                          : 'text-neutral-300'
                      }`}
                    />
                  </button>
                ))}
                {userBook?.rating && (
                  <span className="ml-2 text-lg font-ui text-neutral-700">
                    {userBook.rating} {/*Revisar para poner 1/2 puntos*/}
                  </span>
                )}
              </div>

              {/* Progreso */}
              {userBook && (
                <div className="card-vintage">
                  <h3 className="text-lg font-heading mb-3">Progreso de lectura</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm font-ui mb-1">
                        <span>
                          {userBook.currentPage} / {userBook.totalPages} páginas
                        </span>
                        <span>{parseFloat(userBook.progressPercent).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-3">
                        <div
                          className="bg-primary-500 h-3 rounded-full transition-all"
                          style={{ width: `${userBook.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-neutral-600 font-ui">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{userBook.totalReadingTimeMinutes} min</span>
                      </div>
                      {userBook.lastReadAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Última lectura:{' '}
                            {new Date(userBook.lastReadAt).toLocaleDateString()}
                          </span>
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
                  <p className="text-neutral-700 font-ui leading-relaxed">
                    {book.descripcion}
                  </p>
                </div>
              )}

              {/* Información del libro */}
              <div className="card-vintage">
                <h3 className="text-lg font-heading mb-4">Información</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {book.publicacion && (
                    <div>
                      <p className="text-sm text-neutral-500 font-ui">Editorial</p>
                      <p className="text-neutral-900 font-ui">{book.publicacion}</p>
                    </div>
                  )}
                  {book.fechaPublicacion && (
                    <div>
                      <p className="text-sm text-neutral-500 font-ui">
                        Fecha de publicación
                      </p>
                      <p className="text-neutral-900 font-ui">{book.fechaPublicacion}</p>
                    </div>
                  )}
                  {book.pageCount && (
                    <div>
                      <p className="text-sm text-neutral-500 font-ui">Páginas</p>
                      <p className="text-neutral-900 font-ui">{book.pageCount}</p>
                    </div>
                  )}
                  {book.idioma && (
                    <div>
                      <p className="text-sm text-neutral-500 font-ui">Idioma</p>
                      <p className="text-neutral-900 font-ui uppercase">{book.idioma}</p>
                    </div>
                  )}
                  {book.isbn13 && (
                    <div>
                      <p className="text-sm text-neutral-500 font-ui">ISBN-13</p>
                      <p className="text-neutral-900 font-ui font-mono text-sm">
                        {book.isbn13}
                      </p>
                    </div>
                  )}
                  {book.isbn10 && (
                    <div>
                      <p className="text-sm text-neutral-500 font-ui">ISBN-10</p>
                      <p className="text-neutral-900 font-ui font-mono text-sm">
                        {book.isbn10}
                      </p>
                    </div>
                  )}
                </div>

                {/* Categorías */}
                {book.categorias && (
                  <div className="mt-4">
                    <p className="text-sm text-neutral-500 font-ui mb-2">Categorías</p>
                    <div className="flex flex-wrap gap-2">
                      {book.categorias.split(',').map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-ui"
                        >
                          {cat.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags del usuario */}
                {userBook?.tags && (
                  <div className="mt-4">
                    <p className="text-sm text-neutral-500 font-ui mb-2">Mis etiquetas</p>
                    <div className="flex flex-wrap gap-2">
                      {userBook.tags.split(',').map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-ui flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3" />
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Archivos disponibles */}
              <div className="card-vintage">
                <h3 className="text-lg font-heading mb-3">Archivos disponibles</h3>
                <div className="space-y-2">
                  {book.pdfFileUrl && (
                    <div className="flex items-center gap-2 text-neutral-700 font-ui">
                      <FileText className="w-5 h-5 text-red-500" />
                      <span>Archivo PDF disponible</span>
                    </div>
                  )}
                  {book.epubFileUrl && (
                    <div className="flex items-center gap-2 text-neutral-700 font-ui">
                      <BookOpen className="w-5 h-5 text-green-500" />
                      <span>Archivo EPUB disponible</span>
                    </div>
                  )}
                  {!book.pdfFileUrl && !book.epubFileUrl && (
                    <p className="text-neutral-500 font-ui text-sm">
                      No hay archivos disponibles para leer
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      <EditBookModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        book={book}
        userBook={userBook}
        onBookUpdated={loadBookDetails}
      />
    </>
  );
}