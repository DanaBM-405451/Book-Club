// src/components/groups/GroupGoals.jsx
'use client';

import { useState, useEffect } from 'react';
import { Target, BookOpen, Calendar, Clock, Edit2, Trash2, Plus, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function GroupGoals({ groupId, group }) {
  const { user } = useAuthStore();
  const [goals, setGoals] = useState([]);
  const [activeGoal, setActiveGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [myBooks, setMyBooks] = useState([]);

  const isAdmin = group.userMembership?.role === 'ADMIN';

  useEffect(() => {
    loadGoals();
    loadActiveGoal();
    loadMyBooks();
  }, [groupId]);

  const loadGoals = async () => {
  try {
    setLoading(true);
    const response = await api.get(`/api/social/groups/${groupId}/goals`, {
      params: { includeInactive: true },
    });
    setGoals(Array.isArray(response.data) ? response.data : response.data?.data || []);
  } catch (error) {
    console.error('Error loading goals:', error);
    if (error.response?.status !== 404) {
      toast.error('Error al cargar las metas');
    }
    setGoals([]); // ✅ Asegurarnos que siempre sea un array
  } finally {
    setLoading(false);
  }
};

  // 1. CORREGIR LA CARGA DE DATOS
const loadActiveGoal = async () => {
  try {
    const response = await api.get(`/api/social/groups/${groupId}/goals/active`);
    
    // ✅ CORRECCIÓN CRÍTICA: Desempaquetar 'data'
    // Si response.data.data existe, úsalo. Si no, usa response.data (por si acaso).
    setActiveGoal(response.data.data || response.data);
    
  } catch (error) {
    // Si da 404 es que no hay meta activa, no es un error grave
    setActiveGoal(null);
  }
};

  const loadMyBooks = async () => {
  try {
    const response = await api.get('/api/library/books');
    console.log('📚 Full response:', response.data); // ✅ Debug
    
    // ✅ Acceder correctamente a userBooks
    const userBooks = response.data?.data?.userBooks || [];
    const books = userBooks.map(ub => ({
      id: ub.book.id,
      title: ub.book.titulo,
      author: ub.book.autor,
      coverUrl: ub.book.coverImageUrl
    }));
    
    console.log('📚 Books array:', books); // ✅ Debug
    setMyBooks(books);
  } catch (error) {
    console.error('Error loading books:', error);
    setMyBooks([]);
  }
};

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('¿Estás seguro de eliminar esta meta?')) return;

    try {
      await api.delete(`/api/social/groups/${groupId}/goals/${goalId}`);
      toast.success('Meta eliminada exitosamente');
      loadGoals();
      loadActiveGoal();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Error al eliminar la meta');
    }
  };

  const handleCompleteGoal = async (goalId) => {
    if (!confirm('¿Marcar esta meta como completada?')) return;

    try {
      await api.post(`/api/social/groups/${groupId}/goals/${goalId}/complete`);
      toast.success('¡Meta completada! 🎉');
      loadGoals();
      loadActiveGoal();
    } catch (error) {
      console.error('Error completing goal:', error);
      toast.error('Error al completar la meta');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-heading text-neutral-800">
            Metas de Lectura
          </h2>
          <p className="text-sm text-neutral-600 font-ui mt-1">
            Metas compartidas para leer en equipo
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Meta
          </button>
        )}
      </div>

      {/* Meta Activa */}
      {activeGoal && (
        <div className="card-vintage border-2 border-green-400 bg-green-50">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-heading text-green-900">
              Meta Activa
            </h3>
          </div>
          <ActiveGoalCard
            goal={activeGoal}
            groupId={groupId}
            isAdmin={isAdmin}
            onComplete={handleCompleteGoal}
            onEdit={(goal) => {
              setEditingGoal(goal);
              setShowEditModal(true);
            }}
            onDelete={handleDeleteGoal}
          />
        </div>
      )}

      {/* Historial de metas */}
      <div>
        <h3 className="text-lg font-heading text-neutral-800 mb-4">
          Historial de Metas
        </h3>

        {goals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
            <p className="text-neutral-500 font-ui">
              No hay metas todavía. {isAdmin && '¡Crea la primera meta del grupo!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                groupId={groupId}
                isAdmin={isAdmin}
                onEdit={(goal) => {
                  setEditingGoal(goal);
                  setShowEditModal(true);
                }}
                onDelete={handleDeleteGoal}
                onComplete={handleCompleteGoal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Meta */}
      {showCreateModal && (
        <GoalModal
          groupId={groupId}
          myBooks={myBooks}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadGoals();
            loadActiveGoal();
          }}
        />
      )}

      {/* Modal Editar Meta */}
      {showEditModal && editingGoal && (
        <GoalModal
          groupId={groupId}
          myBooks={myBooks}
          goal={editingGoal}
          onClose={() => {
            setShowEditModal(false);
            setEditingGoal(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingGoal(null);
            loadGoals();
            loadActiveGoal();
          }}
        />
      )}
    </div>
  );
}

// Componente ActiveGoalCard
// 2. CORREGIR EL COMPONENTE VISUAL (Reemplaza la función ActiveGoalCard completa)
function ActiveGoalCard({ goal, groupId, isAdmin, onComplete, onEdit, onDelete }) {
  
  const getFrequencyLabel = (frequency) => {
    const labels = { DAILY: 'Diaria', WEEKLY: 'Semanal', MONTHLY: 'Mensual' };
    return labels[frequency] || frequency || 'Semanal';
  };

  // Datos seguros
  const title = goal.bookTitle || goal.book?.title || "Meta de Lectura";
  const author = goal.bookAuthor || goal.book?.author;
  const cover = goal.bookCoverUrl || goal.book?.coverImageUrl;
  
  // Helper para fechas seguras
  const formatDate = (dateStr) => {
      if (!dateStr) return 'Pendiente';
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'Fecha inválida' : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-neutral-100">
      <div className="flex flex-col sm:flex-row gap-6">
        
        {/* Portada */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          {cover ? (
            <img src={cover} alt={title} className="w-32 h-48 object-cover rounded-md shadow-md" />
          ) : (
            <div className="w-32 h-48 bg-neutral-100 rounded-md flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-neutral-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-2xl font-heading font-bold text-neutral-900 mb-1">{title}</h4>
          {author && <p className="text-neutral-500 font-ui mb-4 text-sm">{author}</p>}

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-neutral-700">
              <Target className="w-5 h-5 text-green-600" />
              <span className="font-ui font-medium">
                Meta: {goal.targetPages || '?'} págs • {getFrequencyLabel(goal.frequency)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-neutral-600 text-sm">
              <Calendar className="w-4 h-4" />
              <span className="font-ui">
                {formatDate(goal.startDate)} — {formatDate(goal.endDate)}
              </span>
            </div>
          </div>

          {/* Botones Admin */}
          {isAdmin && (
            <div className="flex gap-2 pt-2 border-t border-neutral-100 mt-2">
              <button onClick={() => onComplete(goal.id)} className="btn-primary text-sm py-2 px-4">
                Marcar Completada
              </button>
              <button onClick={() => onEdit(goal)} className="btn-outline text-sm py-2 px-4 flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Editar
              </button>
              <button onClick={() => onDelete(goal.id)} className="p-2 text-red-500 hover:bg-red-50 rounded ml-auto">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente GoalCard
function GoalCard({ goal, groupId, isAdmin, onEdit, onDelete, onComplete }) {
  const getStatusBadge = () => {
    if (goal.status === 'COMPLETED') {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-heading font-bold">
          ✓ Completada
        </span>
      );
    }
    if (goal.status === 'CANCELLED') {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-heading font-bold">
          ✗ Cancelada
        </span>
      );
    }
    if (goal.isExpired) {
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-heading font-bold">
          ⏱ Expirada
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-heading font-bold">
        En progreso
      </span>
    );
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      DAILY: 'Diaria',
      WEEKLY: 'Semanal',
      MONTHLY: 'Mensual',
    };
    return labels[frequency] || frequency;
  };

  return (
    <div className="card-vintage">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-lg font-heading font-bold text-neutral-800">
              {goal.bookTitle}
            </h4>
            {getStatusBadge()}
          </div>

          <div className="space-y-1 text-sm text-neutral-600 font-ui">
            <div>Meta: {goal.targetPages} páginas - {getFrequencyLabel(goal.frequency)}</div>
            <div>
              {new Date(goal.startDate).toLocaleDateString('es-ES')} -{' '}
              {new Date(goal.endDate).toLocaleDateString('es-ES')}
            </div>
          </div>
        </div>

        {isAdmin && goal.status === 'ACTIVE' && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(goal)}
              className="p-2 text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="p-2 text-red-600 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Modal GoalModal (Crear/Editar)
function GoalModal({ groupId, myBooks, goal = null, onClose, onSuccess }) {
  const isEdit = !!goal;
  const [formData, setFormData] = useState({
    bookId: goal?.bookId || '',
    bookTitle: goal?.bookTitle || '',
    startDate: goal?.startDate ? goal.startDate.split('T')[0] : '',
    endDate: goal?.endDate ? goal.endDate.split('T')[0] : '',
    targetPages: goal?.targetPages || '',
    frequency: goal?.frequency || 'WEEKLY',
    description: goal?.description || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.bookId) {
      toast.error('Selecciona un libro');
      return;
    }

    try {
      setLoading(true);
      if (isEdit) {
        await api.put(`/api/social/groups/${groupId}/goals/${goal.id}`, formData);
        toast.success('Meta actualizada exitosamente');
      } else {
        await api.post(`/api/social/groups/${groupId}/goals`, formData);
        toast.success('Meta creada exitosamente');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error(error.response?.data?.message || 'Error al guardar la meta');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSelect = (e) => {
    const bookId = parseInt(e.target.value);
    const book = myBooks.find((b) => b.id === bookId);
    if (book) {
      setFormData({
        ...formData,
        bookId: book.id,
        bookTitle: book.title,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-heading text-neutral-800">
            {isEdit ? 'Editar Meta' : 'Crear Meta de Lectura'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selector de libro */}
          <div>
            <label className="label-field">Libro *</label>
            <select
              value={formData.bookId}
              onChange={handleBookSelect}
              className="input-field"
              required
              
            >
              <option value="">-- Selecciona un libro --</option>
              {myBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} {book.author && `- ${book.author}`}
                </option>
              ))}
            </select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Fecha de inicio *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label-field">Fecha de fin *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Meta y frecuencia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Páginas meta *</label>
              <input
                type="number"
                value={formData.targetPages}
                onChange={(e) =>
                  setFormData({ ...formData, targetPages: e.target.value })
                }
                min="1"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label-field">Frecuencia *</label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value })
                }
                className="input-field"
                required
              >
                <option value="DAILY">Diaria</option>
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensual</option>
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="label-field">Descripción (opcional)</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-field min-h-[100px]"
              placeholder="Agrega una descripción o motivación para esta meta..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Guardando...' : isEdit ? 'Actualizar Meta' : 'Crear Meta'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}