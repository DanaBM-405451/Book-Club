// src/components/groups/GroupChallenges.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, BookOpen, Users, Calendar, TrendingUp, Award, Plus, X, Archive, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function GroupChallenges({ groupId, group, isMember }) {
  const { user } = useAuthStore();
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  
  const [myBooks, setMyBooks] = useState([]);
  const isAdmin = group.userMembership?.role === 'ADMIN';

  // Función de carga de datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Cargar Historial (incluye archivados)
      const resHistory = await api.get(`/api/social/groups/${groupId}/challenges`, {
        params: { includeArchived: true },
      });
      const historyData = resHistory.data.data || resHistory.data || [];
      setChallenges(Array.isArray(historyData) ? historyData : []);

      // 2. Cargar Activo (si existe)
      try {
        const resActive = await api.get(`/api/social/groups/${groupId}/challenges/active`);
        setActiveChallenge(resActive.data.data || resActive.data || null);
      } catch (e) {
        setActiveChallenge(null);
      }

    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Cargar libros (para el selector de crear reto)
  useEffect(() => {
    const fetchBooks = async () => {
        try {
            const response = await api.get('/api/library/books');
            const userBooks = response.data?.data?.userBooks || [];
            setMyBooks(userBooks.map(ub => ({
                id: ub.book.id,
                title: ub.book.titulo,
                author: ub.book.autor,
                coverUrl: ub.book.coverImageUrl
            })));
        } catch (e) { console.error("Error loading books"); }
    };
    fetchBooks();
  }, []);

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- HANDLERS ---
  const handleJoinChallenge = async (challengeId) => {
    if (!challengeId) return toast.error("Error: ID inválido");
    try {
      await api.post(`/api/social/groups/${groupId}/challenges/${challengeId}/join`);
      toast.success('¡Te has unido!');
      loadData();
    } catch (error) { toast.error('Error al unirse'); }
  };

  const handleArchiveChallenge = async (challengeId) => {
    if (!confirm('¿Archivar este reto?')) return;
    try {
      await api.post(`/api/social/groups/${groupId}/challenges/${challengeId}/archive`);
      toast.success('Archivado');
      loadData();
    } catch (error) { toast.error('Error al archivar'); }
  };

  const handleReactivateChallenge = async (challengeId, newEndDate) => {
    try {
      await api.post(`/api/social/groups/${groupId}/challenges/${challengeId}/reactivate`, { newEndDate });
      toast.success('Reactivado');
      loadData();
    } catch (error) { toast.error('Error al reactivar'); }
  };

  if (loading && challenges.length === 0 && !activeChallenge) {
      return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-heading text-neutral-800">Retos de Lectura</h2>
          <p className="text-sm text-neutral-600 font-ui mt-1">Compite con otros miembros</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Crear Reto
          </button>
        )}
      </div>

      {/* RETO ACTIVO */}
      {activeChallenge && (
        <div className="card-vintage border-2 border-purple-400 bg-purple-50">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-heading text-purple-900">Reto Activo</h3>
          </div>
          <ActiveChallengeCard
            challenge={activeChallenge}
            isMember={isMember}
            isAdmin={isAdmin}
            onJoin={() => handleJoinChallenge(activeChallenge.id)}
            onUpdateProgress={() => { setSelectedChallenge(activeChallenge); setShowProgressModal(true); }}
            onViewRanking={() => { setSelectedChallenge(activeChallenge); setShowRankingModal(true); }}
            onArchive={() => handleArchiveChallenge(activeChallenge.id)}
          />
        </div>
      )}

      {/* HISTORIAL */}
      <div>
        <h3 className="text-lg font-heading text-neutral-800 mb-4">Historial</h3>
        {challenges.length === 0 && !activeChallenge ? (
          <div className="text-center py-12 border rounded-lg bg-neutral-50">
            <Trophy className="w-12 h-12 mx-auto text-neutral-300 mb-2" />
            <p className="text-neutral-500">No hay retos todavía.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.filter(c => c.id !== activeChallenge?.id).map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isAdmin={isAdmin}
                onReactivate={(date) => handleReactivateChallenge(challenge.id, date)}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODALES */}
      {showCreateModal && (
        <ChallengeModal
          groupId={groupId}
          myBooks={myBooks}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); loadData(); }}
        />
      )}

      {showProgressModal && selectedChallenge && (
        <ProgressModal
          groupId={groupId}
          challenge={selectedChallenge}
          onClose={() => { setShowProgressModal(false); setSelectedChallenge(null); }}
          onSuccess={() => { setShowProgressModal(false); setSelectedChallenge(null); loadData(); }}
        />
      )}

      {showRankingModal && selectedChallenge && (
        <RankingModal
          groupId={groupId}
          challenge={selectedChallenge}
          onClose={() => { setShowRankingModal(false); setSelectedChallenge(null); }}
        />
      )}
    </div>
  );
}

// --- SUBCOMPONENTES ---

function ActiveChallengeCard({ challenge, isMember, isAdmin, onJoin, onUpdateProgress, onViewRanking, onArchive }) {
  const userProgress = challenge.userProgress;
  const isParticipating = !!userProgress;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex gap-4 flex-col sm:flex-row">
        {/* Portada */}
        <div className="w-24 h-36 bg-neutral-200 rounded flex-shrink-0 mx-auto sm:mx-0 flex items-center justify-center overflow-hidden">
           {challenge.bookCoverUrl ? <img src={challenge.bookCoverUrl} alt="Cover" className="w-full h-full object-cover"/> : <BookOpen className="text-neutral-400"/>}
        </div>

        <div className="flex-1">
          <h4 className="text-xl font-bold text-neutral-900 mb-1">{challenge.bookTitle}</h4>
          <p className="text-neutral-600 text-sm mb-4">{challenge.bookAuthor}</p>

          <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mb-4">
             <span className="flex items-center gap-1"><BookOpen className="w-4 h-4"/> {challenge.totalPages} págs</span>
             <span className="flex items-center gap-1"><Users className="w-4 h-4"/> {challenge.participantsCount}</span>
             <span className="flex items-center gap-1 text-purple-600 font-medium"><Trophy className="w-4 h-4"/> {challenge.daysRemaining} días</span>
          </div>

          {isParticipating && (
            <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex justify-between text-sm font-bold text-purple-700 mb-1">
                <span>Tu Progreso</span>
                <span>{Math.round(userProgress.progressPercent)}%</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${userProgress.progressPercent}%` }}></div>
              </div>
              <p className="text-xs text-purple-600 mt-1 text-right">{userProgress.currentPage} / {challenge.totalPages} págs</p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {!isParticipating ? (
               isMember ? (
                 <button onClick={onJoin} className="btn-primary text-sm py-2 px-4"><Plus className="w-4 h-4 inline mr-1"/> Unirse</button>
               ) : (
                 <button disabled className="btn-secondary text-sm py-2 px-4 opacity-50 cursor-not-allowed">Únete para participar</button>
               )
            ) : (
               <button onClick={onUpdateProgress} className="btn-primary text-sm py-2 px-4"><TrendingUp className="w-4 h-4 inline mr-1"/> Actualizar</button>
            )}
            <button onClick={onViewRanking} className="btn-outline text-sm py-2 px-4"><Award className="w-4 h-4 inline mr-1"/> Ranking</button>
            {isAdmin && <button onClick={onArchive} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded text-sm font-medium ml-auto">Archivar</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, isAdmin, onReactivate }) {
  const [date, setDate] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleReactivate = () => {
    if (!newEndDate) return toast.error('Selecciona fecha');
    onReactivate(newEndDate);
    setShowReactivateInput(false);
  };

  return (
    <div className="card-vintage bg-white p-4 flex justify-between items-start">
       <div>
          <div className="flex items-center gap-2 mb-1">
             <h4 className="font-bold text-neutral-700">{challenge.bookTitle}</h4>
             {challenge.status === 'ARCHIVED' && <span className="text-xs bg-neutral-200 px-2 py-0.5 rounded text-neutral-600">Archivado</span>}
          </div>
          <p className="text-sm text-neutral-500">{challenge.bookAuthor}</p>
          <div className="flex gap-4 mt-2 text-xs text-neutral-400">
             <span>{challenge.participantsCount} participantes</span>
             {challenge.endDate && <span>Fin: {new Date(challenge.endDate).toLocaleDateString()}</span>}
          </div>
       </div>
       
       {isAdmin && challenge.status === 'ARCHIVED' && (
          <div>
             {!showInput ? (
                <button onClick={() => setShowInput(true)} className="text-xs btn-outline py-1 px-2 flex items-center gap-1"><RotateCcw className="w-3 h-3"/> Reactivar</button>
             ) : (
                <div className="flex gap-1">
                   <input type="date" className="input-field py-1 px-2 text-xs w-28" onChange={e => setDate(e.target.value)} />
                   <button onClick={() => { onReactivate(date); setShowInput(false); }} className="btn-primary py-1 px-2 text-xs">✓</button>
                   <button onClick={() => setShowInput(false)} className="btn-outline py-1 px-2 text-xs">✕</button>
                </div>
             )}
          </div>
       )}
    </div>
  );
}

function ChallengeModal({ groupId, myBooks, onClose, onSuccess }) {
  const [form, setForm] = useState({ bookId: '', bookTitle: '', bookAuthor: '', totalPages: '', startDate: '', endDate: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post(`/api/social/groups/${groupId}/challenges`, form);
      toast.success('Reto creado');
      onSuccess();
    } catch (e) { toast.error('Error al crear'); } finally { setLoading(false); }
  };

  const handleSelect = (e) => {
     const b = myBooks.find(book => book.id === parseInt(e.target.value));
     if (b) setForm({ ...form, bookId: b.id, bookTitle: b.title, bookAuthor: b.author || '', totalPages: b.pageCount || 300 });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
       <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
          <h2 className="text-xl font-bold mb-4">Crear Reto</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
             <select className="input-field" onChange={handleSelect} required>
                <option value="">Selecciona un libro...</option>
                {myBooks.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
             </select>
             <input type="number" placeholder="Páginas totales" className="input-field" value={form.totalPages} onChange={e => setForm({...form, totalPages: e.target.value})} required />
             <div className="grid grid-cols-2 gap-2">
                <input type="date" className="input-field" required onChange={e => setForm({...form, startDate: e.target.value})} />
                <input type="date" className="input-field" required onChange={e => setForm({...form, endDate: e.target.value})} />
             </div>
             <textarea placeholder="Descripción" className="input-field h-20" onChange={e => setForm({...form, description: e.target.value})} />
             <div className="flex gap-2 pt-2">
                <button type="button" onClick={onClose} className="btn-outline flex-1">Cancelar</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? '...' : 'Crear'}</button>
             </div>
          </form>
       </div>
    </div>
  );
}

function ProgressModal({ groupId, challenge, onClose, onSuccess }) {
  const [page, setPage] = useState(challenge.userProgress?.currentPage || 0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
     e.preventDefault();
     try {
        setLoading(true);
        await api.post(`/api/social/groups/${groupId}/challenges/${challenge.id}/progress`, { currentPage: parseInt(page) });
        toast.success('Actualizado');
        onSuccess();
     } catch(e) { toast.error('Error'); } finally { setLoading(false); }
  };

  return (
     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full">
           <h3 className="font-bold text-lg mb-4">Actualizar Progreso</h3>
           <form onSubmit={handleSubmit}>
              <label className="text-sm text-neutral-600 block mb-1">Página actual (máx {challenge.totalPages})</label>
              <input type="number" className="input-field mb-4" value={page} onChange={e => setPage(e.target.value)} max={challenge.totalPages} min={0} />
              <div className="flex gap-2">
                 <button type="button" onClick={onClose} className="btn-outline flex-1">Cancelar</button>
                 <button type="submit" disabled={loading} className="btn-primary flex-1">Guardar</button>
              </div>
           </form>
        </div>
     </div>
  );
}

function RankingModal({ groupId, challenge, onClose }) {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     if(!challenge?.id) return;
     
     api.get(`/api/social/groups/${groupId}/challenges/${challenge.id}/ranking`)
        .then(res => {
            // Desempaquetar datos
            const data = res.data.data || res.data;
            setRanking(data.ranking || []);
        })
        .catch(err => {
            console.error(err);
            setRanking([]);
        })
        .finally(() => setLoading(false));
  }, [groupId, challenge]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
       <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-lg text-neutral-800">Ranking: {challenge.bookTitle}</h3>
             <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5 text-neutral-500"/></button>
          </div>
          
          {loading ? (
             <div className="py-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 inline-block"></div></div>
          ) : ranking.length === 0 ? (
             <div className="text-center py-8 bg-neutral-50 rounded-lg">
                <p className="text-neutral-500">Aún no hay participantes con progreso.</p>
             </div>
          ) : (
             <div className="space-y-2">
                {ranking.map((r, i) => {
                   // Cálculo matemático manual para evitar el 0%
                   const percent = challenge.totalPages > 0 
                      ? Math.min(100, Math.round((r.currentPage / challenge.totalPages) * 100))
                      : 0;

                   return (
                     <div key={i} className="flex justify-between items-center p-3 bg-white rounded border border-neutral-100 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                           <span className={`font-bold text-lg w-6 text-center ${i===0?'text-yellow-500':i===1?'text-gray-400':i===2?'text-orange-500':'text-neutral-400'}`}>
                              {i+1}
                           </span>
                           <div className="flex flex-col">
                              <span className="font-medium text-neutral-800">{r.user?.username || 'Usuario'}</span>
                              {(r.isCompleted || percent === 100) && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded w-fit font-bold mt-0.5">
                                  Completado
                                </span>
                              )}
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="font-bold text-purple-600 block text-lg">{percent}%</span>
                           <span className="text-xs text-neutral-400">{r.currentPage} / {challenge.totalPages} págs</span>
                        </div>
                     </div>
                   );
                })}
             </div>
          )}
       </div>
    </div>
  );
}