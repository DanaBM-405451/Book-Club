// src/components/groups/CreateGroupModal.jsx
'use client';

import { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: '',
    cover: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre del grupo es requerido');
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append('name', formData.name.trim());
      if (formData.description) data.append('description', formData.description.trim());
      data.append('isPrivate', formData.isPrivate);
      if (formData.maxMembers) data.append('maxMembers', formData.maxMembers);
      if (formData.cover) data.append('cover', formData.cover);

      await api.post('/api/social/groups', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('¡Grupo creado exitosamente!');
      onGroupCreated?.();
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
          className="relative bg-white rounded-lg shadow-book max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h3 className="text-2xl font-heading">Crear Grupo de Lectura</h3>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Nombre */}
            <div>
              <label className="label-field">Nombre del grupo *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Club de Ciencia Ficción"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="label-field">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows={4}
                placeholder="Describe de qué trata tu grupo de lectura..."
              />
            </div>

            {/* Máximo de miembros */}
            <div>
              <label className="label-field">Máximo de miembros (opcional)</label>
              <input
                type="number"
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                className="input-field"
                placeholder="20"
                min="2"
              />
            </div>

            {/* Privacidad */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div>
                <p className="font-ui font-medium text-neutral-900">Grupo privado</p>
                <p className="text-sm text-neutral-600">
                  Los miembros deben solicitar unirse
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isPrivate ? 'bg-primary-500' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isPrivate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Portada */}
            <div>
              <label className="label-field">Portada del grupo (opcional)</label>
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('La imagen no debe superar los 5MB');
                        return;
                      }
                      setFormData({ ...formData, cover: file });
                    }
                  }}
                  className="hidden"
                  id="group-cover"
                />
                <label htmlFor="group-cover" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="w-12 h-12 text-neutral-400" />
                  {formData.cover ? (
                    <p className="text-sm text-green-600 font-ui">✓ {formData.cover.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-neutral-600 font-ui">Haz clic para subir una imagen</p>
                      <p className="text-xs text-neutral-500">PNG, JPG (máx. 5MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline"
                disabled={loading}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
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