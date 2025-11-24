//src/components/groups/GroupProposals.jsx
'use client';

import { useState, useEffect } from 'react';
import { BookOpen, ThumbsUp, Crown, Calendar, X, Plus, Trophy, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function GroupProposals({ groupId, group, onUpdate, isMember }) {
  const { user } = useAuthStore();
  const [proposals, setProposals] = useState([]);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Estado para el modal de confirmación (Reemplaza al window.confirm)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'CLOSE' | 'CANCEL'
    proposalId: null,
    title: '',
    message: '',
    confirmText: '',
    isDangerous: false
  });

  const [myBooks, setMyBooks] = useState([]);
  const isAdmin = group.userMembership?.role === 'ADMIN';

  useEffect(() => {
    loadData();
    loadMyBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resProp, resWin] = await Promise.all([
        api.get(`/api/social/groups/${groupId}/proposals`, { params: { includeInactive: false } }),
        api.get(`/api/social/groups/${groupId}/proposals/winner`).catch(() => ({ data: null }))
      ]);
      setProposals(resProp.data.data || []);
      const winnerResponse = resWin.data; 
      setWinner(winnerResponse?.data || winnerResponse || null);
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyBooks = async () => {
    try {
      const response = await api.get('/api/library/books');
      const userBooks = response.data?.data?.userBooks || [];
      setMyBooks(userBooks.map(ub => ({
        id: ub.book.id,
        title: ub.book.titulo,
        author: ub.book.autor,
        coverUrl: ub.book.coverImageUrl,
        description: ub.book.descripcion
      })));
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const handleVote = async (id) => {
    try {
      await api.post(`/api/social/groups/${groupId}/proposals/${id}/vote`);
      toast.success('Voto registrado');
      loadData();
      onUpdate();
    } catch (e) { toast.error(e.response?.data?.message || 'Error al votar'); }
  };

  // --- LÓGICA DE CONFIRMACIÓN ---

  // 1. Abrir modal para CERRAR VOTACIÓN
  const requestCloseProposal = (id) => {
    setConfirmModal({
      isOpen: true,
      type: 'CLOSE',
      proposalId: id,
      title: '¿Cerrar votación?',
      message: 'Al cerrar la votación se contabilizarán los votos y se declarará este libro como ganador definitivo.',
      confirmText: 'Sí, cerrar votación',
      isDangerous: false
    });
  };

  // 2. Abrir modal para CANCELAR PROPUESTA
  const requestCancelProposal = (id) => {
    setConfirmModal({
      isOpen: true,
      type: 'CANCEL',
      proposalId: id,
      title: '¿Cancelar propuesta?',
      message: 'Esta acción eliminará la propuesta y los votos asociados. No se puede deshacer.',
      confirmText: 'Sí, eliminar',
      isDangerous: true
    });
  };

  // 3. Ejecutar acción al confirmar
  const handleConfirmAction = async () => {
    const { type, proposalId } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false }); // Cerrar modal

    try {
      if (type === 'CLOSE') {
        await api.post(`/api/social/groups/${groupId}/proposals/${proposalId}/close`);
        toast.success('Votación cerrada');
        loadData(); // Recargar para ver ganador
        onUpdate();
      } else if (type === 'CANCEL') {
        await api.delete(`/api/social/groups/${groupId}/proposals/${proposalId}`);
        toast.success('Propuesta cancelada');
        loadData();
        onUpdate();
      }
    } catch (error) {
      console.error(error);
      toast.error('Ocurrió un error al procesar la acción');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-heading text-neutral-800">Propuestas de Libros</h2>
          <p className="text-sm text-neutral-600 font-ui mt-1">
            Vota por el próximo libro que leerá el grupo
          </p>
        </div>
        {isMember && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Proponer Libro
          </button>
        )}
      </div>

      {/* Ganador */}
      {winner && (
        <div className="card-vintage border-2 border-amber-400 bg-amber-50">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-amber-600" />
            <h3 className="text-lg font-heading text-amber-900">Libro Ganador</h3>
          </div>
          <WinnerCard winner={winner} />
        </div>
      )}

      {/* Lista de propuestas */}
      {proposals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
          <BookOpen className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500 font-ui">No hay propuestas activas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              groupId={groupId}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              isMember={isMember}
              onVote={handleVote}
              onCloseRequest={requestCloseProposal} // Usamos la función del modal
              onCancelRequest={requestCancelProposal} // Usamos la función del modal
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {showCreateModal && (
        <CreateProposalModal
          groupId={groupId}
          myBooks={myBooks}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
            onUpdate();
          }}
        />
      )}

      {/* Modal de Confirmación Genérico */}
      {confirmModal.isOpen && (
        <ConfirmationModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          isDangerous={confirmModal.isDangerous}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        />
      )}
    </div>
  );
}

// --- SUBCOMPONENTES ---

function ProposalCard({ proposal, currentUserId, isAdmin, isMember, onVote, onCloseRequest, onCancelRequest }) {
  const hasVoted = proposal.hasUserVoted;
  const isProposer = proposal.proposedBy === currentUserId;
  const isExpired = proposal.isExpired;

  // Calculo de días restantes
  const getDaysLeft = () => {
      if (!proposal.votingEndDate) return null;
      const diff = new Date(proposal.votingEndDate) - new Date();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
  const daysLeft = getDaysLeft();

  return (
    <div className="card-vintage relative flex flex-col h-full">
      {proposal.isWinner && (
        <div className="absolute top-4 right-4"><Crown className="w-6 h-6 text-amber-500" /></div>
      )}

      <div className="flex gap-4 mb-4 flex-1">
        {proposal.bookCoverUrl ? (
          <img src={proposal.bookCoverUrl} alt={proposal.bookTitle} className="w-24 h-36 object-cover rounded shadow-md" />
        ) : (
          <div className="w-24 h-36 bg-neutral-200 rounded flex items-center justify-center"><BookOpen className="w-10 h-10 text-neutral-400" /></div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-neutral-800 mb-1 line-clamp-2">{proposal.bookTitle}</h3>
          <p className="text-sm text-neutral-600 font-ui mb-2 line-clamp-1">{proposal.bookAuthor}</p>
          
          {/* Badge de estado */}
          {isExpired ? (
             <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Expirada</span>
          ) : daysLeft !== null ? (
             <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                <Calendar className="w-3 h-3" /> {daysLeft} días restantes
             </span>
          ) : null}
        </div>
      </div>

      {/* Acciones Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 mt-auto">
        <button
          onClick={() => isMember && onVote(proposal.id)}
          disabled={isExpired || !isMember || hasVoted} // Deshabilitar si ya votó
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg font-ui font-medium text-sm transition-all
            ${hasVoted ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}
            ${(!isMember || isExpired) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <ThumbsUp className="w-4 h-4" />
          {proposal.totalVotes}
        </button>

        <div className="flex gap-2">
          {isAdmin && !isExpired && (
            <button onClick={() => onCloseRequest(proposal.id)} className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors font-medium">
              Cerrar votación
            </button>
          )}
          {(isAdmin || isProposer) && (
            <button onClick={() => onCancelRequest(proposal.id)} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors font-medium">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WinnerCard({ winner }) {
  return (
    <div className="flex gap-4">
      {winner.bookCoverUrl ? (
        <img src={winner.bookCoverUrl} alt={winner.bookTitle} className="w-24 h-36 object-cover rounded shadow-md" />
      ) : (
        <div className="w-24 h-36 bg-neutral-200 rounded flex items-center justify-center"><BookOpen className="w-10 h-10 text-neutral-400" /></div>
      )}
      <div>
        <h3 className="text-2xl font-heading font-bold text-amber-900 mb-1">{winner.bookTitle}</h3>
        <p className="text-lg text-amber-800 font-ui mb-3">{winner.bookAuthor}</p>
        <div className="flex items-center gap-2 text-amber-700 font-medium bg-amber-100 px-3 py-1 rounded-full w-fit">
          <ThumbsUp className="w-4 h-4" /> {winner.totalVotes} votos
        </div>
      </div>
    </div>
  );
}

// --- MODAL DE CREACIÓN ---
function CreateProposalModal({ groupId, myBooks, onClose, onSuccess }) {
  const [source, setSource] = useState('LIBRARY');
  const [formData, setFormData] = useState({ bookId: '', bookTitle: '', bookAuthor: '', bookDescription: '', votingEndDate: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post(`/api/social/groups/${groupId}/proposals`, { ...formData, source, bookId: parseInt(formData.bookId) });
      toast.success('Propuesta creada');
      onSuccess();
    } catch (error) {
      toast.error('Error al crear propuesta');
    } finally { setLoading(false); }
  };

  const handleBookSelect = (e) => {
    const book = myBooks.find(b => b.id === parseInt(e.target.value));
    if (book) setFormData({ ...formData, bookId: book.id, bookTitle: book.title, bookAuthor: book.author || '', bookDescription: book.description || '' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-heading text-neutral-800">Proponer Libro</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-neutral-500" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 bg-neutral-100 p-1 rounded-lg">
             <button type="button" onClick={() => setSource('LIBRARY')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${source === 'LIBRARY' ? 'bg-white shadow text-primary-600' : 'text-neutral-500'}`}>Mi Biblioteca</button>
             <button type="button" onClick={() => setSource('MANUAL')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${source === 'MANUAL' ? 'bg-white shadow text-primary-600' : 'text-neutral-500'}`}>Manual</button>
          </div>

          {source === 'LIBRARY' ? (
             <div>
               <label className="label-field">Selecciona un libro</label>
               <select className="input-field" onChange={handleBookSelect} required>
                 <option value="">-- Elige un libro --</option>
                 {myBooks.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
               </select>
             </div>
          ) : (
             <>
               <input className="input-field" placeholder="Título" value={formData.bookTitle} onChange={e => setFormData({...formData, bookTitle: e.target.value})} required />
               <input className="input-field" placeholder="Autor" value={formData.bookAuthor} onChange={e => setFormData({...formData, bookAuthor: e.target.value})} />
             </>
          )}
          
          <div>
             <label className="label-field">Cierre de votación (Opcional)</label>
             <input type="date" className="input-field" min={new Date().toISOString().split('T')[0]} value={formData.votingEndDate} onChange={e => setFormData({...formData, votingEndDate: e.target.value})} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">{loading ? 'Guardando...' : 'Proponer'}</button>
        </form>
      </div>
    </div>
  );
}

// --- MODAL DE CONFIRMACIÓN BONITO ---
function ConfirmationModal({ title, message, confirmText, isDangerous, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100 animate-in zoom-in-95">
        
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-full ${isDangerous ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
             {isDangerous ? <AlertTriangle className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
          </div>
          <h3 className="text-xl font-heading text-neutral-900">{title}</h3>
        </div>

        <p className="text-neutral-600 font-ui mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-neutral-600 hover:bg-neutral-100 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all
              ${isDangerous ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-700'}
            `}
          >
            {confirmText || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}