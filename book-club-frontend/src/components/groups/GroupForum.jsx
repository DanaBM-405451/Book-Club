//src/components/groups/GroupForum.jsx
'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function GroupForum({ groupId, group, isMember }) {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', bookId: null });

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/social/groups/${groupId}/posts`);
      // El backend devuelve { success: true, data: [...] }
      setPosts(response.data.data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;

    try {
      await api.post(`/api/social/groups/${groupId}/posts`, newPost);
      toast.success('Publicado');
      setNewPost({ content: '', bookId: null });
      setShowCreatePost(false);
      loadPosts();
    } catch (error) {
      toast.error('Error al crear post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('¿Eliminar post?')) return;
    try {
      await api.delete(`/api/social/groups/${groupId}/posts/${postId}`);
      toast.success('Eliminado');
      loadPosts();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  if (loading) return <div className="py-12 text-center text-neutral-500">Cargando foro...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading text-neutral-800">Foro del Grupo</h2>
        
        {isMember && !showCreatePost && (
          <button
            onClick={() => setShowCreatePost(true)}
            className="btn-primary flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Nueva Publicación
          </button>
        )}
      </div>

      {showCreatePost && (
        <div className="card-vintage">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="Comparte algo con el grupo..."
              className="input-field min-h-[100px]"
              autoFocus
            />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Publicar</button>
              <button type="button" onClick={() => setShowCreatePost(false)} className="btn-outline">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            groupId={groupId}
            currentUserId={user?.id}
            isAdmin={group.userMembership?.role === 'ADMIN'}
            onDelete={handleDeletePost}
            onCommentAdded={loadPosts}
            isMember={isMember}
          />
        ))}
        {posts.length === 0 && <p className="text-center text-neutral-500 py-8">No hay publicaciones aún.</p>}
      </div>
    </div>
  );
}

function PostCard({ post, groupId, currentUserId, isAdmin, onDelete, onCommentAdded, isMember }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const loadComments = async () => {
    // Si ya están visibles, solo los ocultamos (toggle)
    if (showComments) {
        setShowComments(false);
        return;
    }

    try {
      const res = await api.get(`/api/social/groups/${groupId}/posts/${post.id}/comments`);
      
      // ✅ CORRECCIÓN PRINCIPAL: Acceder a res.data.data
      // El backend devuelve { success: true, data: [...] }
      const commentsList = res.data.data || res.data || [];
      
      // Aseguramos que sea un array para evitar el error .map
      setComments(Array.isArray(commentsList) ? commentsList : []);
      setShowComments(true);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar comentarios");
      setComments([]); // Fallback a array vacío
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/api/social/groups/${groupId}/posts/${post.id}/comments`, { content: newComment });
      setNewComment('');
      // Recargar comentarios forzosamente
      const res = await api.get(`/api/social/groups/${groupId}/posts/${post.id}/comments`);
      setComments(res.data.data || []);
      
      if(onCommentAdded) onCommentAdded(); // Actualizar contador en el post padre
    } catch (e) {
        toast.error("Error al publicar comentario");
    }
  };

  return (
    <div className="card-vintage">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
              {post.author?.username?.[0] || '?'}
           </div>
           <div>
              <p className="font-bold text-sm">{post.author?.username || 'Usuario'}</p>
              <p className="text-xs text-neutral-500">{new Date(post.createdAt).toLocaleDateString()}</p>
           </div>
        </div>
        {(isAdmin || post.userId === currentUserId) && (
           <button onClick={() => onDelete(post.id)} className="text-neutral-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        )}
      </div>
      
      <p className="text-neutral-800 whitespace-pre-wrap mb-4">{post.content}</p>

      <div className="border-t border-neutral-100 pt-2">
        <button onClick={loadComments} className="text-sm text-neutral-500 hover:text-primary-600 flex items-center gap-1">
           <MessageSquare className="w-4 h-4"/> {post.commentsCount || 0} comentarios
        </button>
      </div>

      {showComments && (
        <div className="mt-4 space-y-4">
           <div className="space-y-3 pl-4 border-l-2 border-neutral-100">
              {comments.length === 0 && <p className="text-xs text-neutral-400">Sé el primero en comentar.</p>}
              
              {comments.map(c => (
                 <div key={c.id}>
                    <p className="text-sm font-bold text-neutral-700">{c.author?.username || 'Usuario'}</p>
                    <p className="text-sm text-neutral-600">{c.content}</p>
                 </div>
              ))}
           </div>

           {isMember ? (
             <form onSubmit={handleAddComment} className="flex gap-2">
               <input 
                 value={newComment} 
                 onChange={(e) => setNewComment(e.target.value)} 
                 placeholder="Escribe un comentario..." 
                 className="input-field py-2 flex-1"
               />
               <button type="submit" disabled={!newComment.trim()} className="btn-primary py-2"><Send className="w-4 h-4"/></button>
             </form>
           ) : (
             <p className="text-xs text-center text-neutral-400 italic bg-neutral-50 p-2 rounded">
               Debes unirte al grupo para comentar.
             </p>
           )}
        </div>
      )}
    </div>
  );
}