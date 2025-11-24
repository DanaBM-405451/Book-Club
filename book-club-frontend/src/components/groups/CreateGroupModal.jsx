// src/components/groups/CreateGroupModal.jsx
'use client';

import { useState } from 'react';
import { X, Upload, Loader2, Globe, Lock } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: '',
    cover: null, // Por ahora no se enviará al backend
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre del grupo es requerido');
      return;
    }

    try {
      setLoading(true);

      // ✅ CAMBIO: Enviamos JSON en lugar de FormData
      // Como el backend de grupos aún no soporta imágenes en la BD, enviamos solo texto.
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        isPublic: !formData.isPrivate, // Convertimos isPrivate a isPublic
        maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : 5
      };

      await api.post('/api/social/groups', payload);

      toast.success('¡Grupo creado exitosamente!');
      if(onGroupCreated) onGroupCreated();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        isPrivate: false,
        maxMembers: '',
        cover: null,
      });
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error(error.response?.data?.message || 'Error al crear el grupo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-100">
            <h3 className="text-2xl font-heading text-neutral-800">Crear Grupo</h3>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded-full hover:bg-neutral-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Nombre */}
            <div>
              <label className="label-field">Nombre del grupo *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Ej: Club de Fantasía Épica"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="label-field">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-[100px] resize-none"
                placeholder="Describe de qué trata tu grupo de lectura..."
              />
            </div>

            {/* Máximo de miembros */}
            <div>
              <label className="label-field">Máximo de miembros</label>
              <input
                type="number"
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                className="input-field"
                placeholder="Por defecto: 5"
                min="2"
                max="50"
              />
            </div>

            {/* Privacidad (Selector Visual) */}
            <div>
              <label className="label-field mb-3 block">Privacidad</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPrivate: false })}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    !formData.isPrivate 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                  }`}
                >
                  <Globe className={`w-6 h-6 mb-2 ${!formData.isPrivate ? 'text-primary-500' : 'text-neutral-400'}`} />
                  <span className="font-bold text-sm">Público</span>
                  <span className="text-xs opacity-75">Cualquiera puede unirse</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPrivate: true })}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    formData.isPrivate 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                  }`}
                >
                  <Lock className={`w-6 h-6 mb-2 ${formData.isPrivate ? 'text-primary-500' : 'text-neutral-400'}`} />
                  <span className="font-bold text-sm">Privado</span>
                  <span className="text-xs opacity-75">Solo invitación</span>
                </button>
              </div>
            </div>

            {/* Mensaje sobre portada (Opcional, para futura implementación) */}
            <div className="p-3 bg-neutral-50 rounded-lg text-xs text-neutral-500 border border-neutral-100">
               ℹ️ La opción de subir imagen de portada estará disponible próximamente.
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline flex-1"
                disabled={loading}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Creando...
                  </>
                ) : (
                  'Crear Grupo'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}