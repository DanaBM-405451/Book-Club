'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, MoreVertical, Star, Trash2, Eye } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function BookCard({ userBook, onUpdate }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const book = userBook.book;

  const handleChangeStatus = async (newStatus) => {
    setLoading(true);
    try {
      await api.put(`/api/library/books/${book.id}/status`, {
        status: newStatus,
      });
      toast.success('Estado actualizado');
      onUpdate?.();
    } catch (error) {
      toast.error('Error al actualizar estado');
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este libro de tu biblioteca?')) return;

    setLoading(true);
    try {
      await api.delete(`/api/library/books/${book.id}`);
      toast.success('Libro eliminado');
      onUpdate?.();
    } catch (error) {
      toast.error('Error al eliminar libro');
    } finally {
      setLoading(false);
    }
  };

  const handleRead = () => {
    router.push(`/book/${book.id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'LEYENDO':
        return 'bg-secondary-500/90 text-white';
      case 'COMPLETADO':
        return 'bg-gold-500/90 text-white';
      case 'QUIERO_LEER':
        return 'bg-primary-500/90 text-white';
      case 'ABANDONADO':
        return 'bg-neutral-500/90 text-white';
      default:
        return 'bg-neutral-500/90 text-white';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'LEYENDO':
        return 'Leyendo';
      case 'COMPLETADO':
        return 'Completado';
      case 'QUIERO_LEER':
        return 'Quiero leer';
      case 'ABANDONADO':
        return 'Abandonado';
      default:
        return status;
    }
  };

  return (
    <div className="group relative">
      {/* Imagen del libro */}
      <div
        className="relative aspect-[2/3] bg-neutral-200 rounded-lg overflow-hidden shadow-card group-hover:shadow-book transition-shadow cursor-pointer"
        onClick={handleRead}
      >
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.titulo}
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
          <div className={`text-xs font-ui font-medium px-2 py-1 rounded backdrop-blur-sm ${getStatusColor(userBook.status)}`}>
            {getStatusText(userBook.status)}
          </div>
        </div>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRead();
            }}
            className="bg-white text-neutral-900 p-2 rounded-full hover:bg-neutral-100 transition-colors"
            title="Leer"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2">
        <h3 className="text-sm font-ui font-medium text-neutral-900 line-clamp-2">
          {book.titulo}
        </h3>
        <p className="text-xs text-neutral-600 line-clamp-1">{book.autor}</p>
      </div>

      {/* Menu */}
      <div className="absolute top-2 right-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-card hover:bg-white transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-neutral-600" />
        </button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />

            {/* Dropdown */}
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-book border border-neutral-200 py-1 z-20">
              {/* Cambiar estado */}
              <div className="px-3 py-1 text-xs font-ui font-medium text-neutral-500">
                Cambiar estado
              </div>
              <button
                onClick={() => handleChangeStatus('QUIERO_LEER')}
                disabled={loading}
                className="w-full text-left px-3 py-2 text-sm font-ui text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
              >
                Quiero leer
              </button>
              <button
                onClick={() => handleChangeStatus('LEYENDO')}
                disabled={loading}
                className="w-full text-left px-3 py-2 text-sm font-ui text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
              >
                Leyendo
              </button>
              <button
                onClick={() => handleChangeStatus('COMPLETADO')}
                disabled={loading}
                className="w-full text-left px-3 py-2 text-sm font-ui text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
              >
                Completado
              </button>
              <button
                onClick={() => handleChangeStatus('ABANDONADO')}
                disabled={loading}
                className="w-full text-left px-3 py-2 text-sm font-ui text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
              >
                Abandonado
              </button>

              <div className="border-t border-neutral-200 my-1" />

              {/* Eliminar */}
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full text-left px-3 py-2 text-sm font-ui text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 inline mr-2" />
                Eliminar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}