// src/components/groups/GroupSettings.jsx
'use client';

import { useState } from 'react';
import { Save, Trash2, UserX, Shield, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function GroupSettings({ group, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description || '',
    isPublic: group.isPublic,
    maxMembers: group.maxMembers
  });

  // Filtrar miembros para no mostrarse a uno mismo en la lista de expulsión
  const membersList = group.members?.filter(m => m.userId !== group.userMembership?.userId) || [];

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/api/social/groups/${group.id}`, formData);
      toast.success('Configuración actualizada');
      onUpdate(); // Recargar datos del padre
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const handleKickMember = async (userId, memberName) => {
    if (!confirm(`¿Estás seguro de que quieres expulsar a ${memberName}?`)) return;

    try {
      await api.delete(`/api/social/groups/${group.id}/members/${userId}`);
      toast.success(`${memberName} ha sido expulsado.`);
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error('Error al expulsar miembro');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- SECCIÓN GENERAL --- */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-heading font-bold text-neutral-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-600" /> Configuración General
        </h3>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Privacidad */}
            <div className="p-4 rounded-lg border-2 border-neutral-100 hover:border-primary-100 transition-colors">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="block font-bold text-neutral-700">Grupo Público</span>
                  <span className="text-xs text-neutral-500">
                    {formData.isPublic ? 'Cualquiera puede ver y unirse.' : 'Solo visible para miembros e invitados.'}
                  </span>
                </div>
                <input 
                  type="checkbox" 
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>
            </div>

            {/* Cupo */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1">
                Cupo Máximo de Miembros
              </label>
              <input 
                type="number" 
                min="2"
                max="100"
                value={formData.maxMembers}
                onChange={(e) => setFormData({...formData, maxMembers: parseInt(e.target.value)})}
                className="input-field w-full"
              />
              <p className="text-xs text-neutral-400 mt-1">Actualmente: {group.membersCount} miembros</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-1">Nombre del Grupo</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-1">Descripción</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input-field w-full"
              rows={3}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" /> Guardar Cambios
            </button>
          </div>
        </form>
      </div>

      {/* --- SECCIÓN GESTIÓN DE MIEMBROS --- */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-heading font-bold text-red-600 mb-4 flex items-center gap-2">
          <UserX className="w-5 h-5" /> Gestión de Miembros
        </h3>
        
        {membersList.length === 0 ? (
          <p className="text-neutral-500 italic">No hay otros miembros en el grupo.</p>
        ) : (
          <div className="space-y-3">
            {membersList.map((member) => (
              <div key={member.userId} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden">
                     {/* Si tienes avatarUrl en el perfil del miembro, úsalo aquí */}
                     <img 
                       src={member.profile?.avatarUrl || '/avatars/avatar_01.png'} 
                       alt={member.profile?.username}
                       className="w-full h-full object-cover"
                     />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-800">{member.profile?.username || 'Usuario'}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {member.role}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleKickMember(member.userId, member.profile?.username)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Expulsar del grupo"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}