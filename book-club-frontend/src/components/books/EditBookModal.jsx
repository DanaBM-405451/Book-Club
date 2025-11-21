'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Save, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal'; // Asumo que tienes este componente del paso anterior
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditBookModal({ isOpen, onClose, book, userBook, onBookUpdated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    descripcion: '',
    tags: '', // Etiquetas separadas por coma
    status: 'QUIERO_LEER',
  });
  
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (book && userBook && isOpen) {
      setFormData({
        titulo: book.titulo || '',
        autor: book.autor || '',
        descripcion: book.descripcion || '',
        tags: userBook.tags || '', 
        status: userBook.status || 'QUIERO_LEER'
      });
      setPreviewUrl(book.coverImageUrl);
      setCoverFile(null);
    }
  }, [book, userBook, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('La imagen es muy pesada (máx 5MB)');
        return;
      }
      setCoverFile(file);
      // Crear URL temporal para previsualización
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      
      // Datos básicos
      data.append('titulo', formData.titulo);
      data.append('autor', formData.autor);
      data.append('descripcion', formData.descripcion);
      data.append('tags', formData.tags);
      data.append('status', formData.status);

      // Si hay nueva imagen, la agregamos
      if (coverFile) {
        data.append('cover', coverFile);
      }

      // NOTA: Asegúrate de que tu backend acepte PUT multipart/form-data en esta ruta
     /* await api.put(`/api/library/books/${userBook.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });*/
      await api.put(`/api/library/books/${book.id}`, data);

      toast.success('Libro actualizado correctamente');
      onBookUpdated(); // Recargar datos en la página padre
      onClose();
    } catch (error) {
      console.error('Error updating book:', error);
      toast.error('Error al actualizar el libro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Libro">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Columna Izquierda: Portada */}
          <div className="md:col-span-1">
            <label className="block text-sm font-ui font-medium text-neutral-700 mb-2">
              Portada
            </label>
            <div className="relative aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden border-2 border-dashed border-neutral-300 hover:border-primary-400 transition-colors group">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Portada preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-neutral-400">
                  <Upload className="w-8 h-8" />
                </div>
              )}
              
              {/* Overlay para subir */}
              <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-xs font-ui">Cambiar imagen</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          {/* Columna Derecha: Datos */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="label-field">Título</label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label-field">Autor</label>
              <input
                type="text"
                name="autor"
                value={formData.autor}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">Estado</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="QUIERO_LEER">Quiero Leer</option>
                <option value="LEYENDO">Leyendo</option>
                <option value="COMPLETADO">Completado</option>
                <option value="ABANDONADO">Abandonado</option>
              </select>
            </div>

            <div>
              <label className="label-field flex items-center justify-between">
                Etiquetas
                <span className="text-xs text-neutral-500 font-normal">Separadas por comas</span>
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Fantasía, Favoritos, 2024..."
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label-field">Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={4}
            className="input-field resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}