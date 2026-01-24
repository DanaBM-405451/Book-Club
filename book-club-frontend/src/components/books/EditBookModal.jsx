'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Save, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import axios from 'axios'; // ✅ Usamos axios directo
import toast from 'react-hot-toast';

// ✅ 1. DEFINICIÓN SEGURA (FUERA DEL COMPONENTE)
// Esto evita el error "ReferenceError: getAuthToken is not defined"
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const storage = localStorage.getItem('auth-storage');
  if (!storage) return null;
  try {
    const { state } = JSON.parse(storage);
    return state?.accessToken || null;
  } catch (error) {
    console.error("Error al leer token:", error);
    return null;
  }
};

export default function EditBookModal({ isOpen, onClose, book, userBook, onBookUpdated }) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    descripcion: '',
    tags: '',
    status: 'QUIERO_LEER',
  });
  
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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
      if (file.size > 5 * 1024 * 1024) { 
        toast.error('La imagen es muy pesada (máx 5MB)');
        return;
      }
      setCoverFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Validar Token
      const token = getAuthToken();
      if (!token) {
        toast.error('No hay sesión activa. Recarga la página.');
        setLoading(false);
        return;
      }

      // 2. Preparar FormData
      const submitData = new FormData();
      submitData.append('titulo', formData.titulo || '');
      submitData.append('autor', formData.autor || '');
      submitData.append('descripcion', formData.descripcion || '');
      submitData.append('tags', formData.tags || '');
      submitData.append('status', formData.status || 'QUIERO_LEER');

      // Solo adjuntar archivo si el usuario subió uno nuevo
      if (coverFile) {
        console.log("📸 Enviando nueva imagen:", coverFile.name);
        submitData.append('cover', coverFile);
      }

      // 3. ✅ USAMOS EL GATEWAY (COMO DEBE SER)
      // Usamos la variable de entorno del Gateway (o default 4000)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      console.log(`🚀 Enviando al Gateway: ${API_URL}/api/library/books/${book.id}`);

      // 4. Petición con Axios (Mantenemos axios directo y Content-Type: undefined)
      await axios.put(`${API_URL}/api/library/books/${book.id}`, submitData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': undefined 
        }
      });        

      toast.success('Libro actualizado correctamente');
      
      if (onBookUpdated) await onBookUpdated();
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
          {/* Portada */}
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

          {/* Datos */}
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