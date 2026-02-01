//src/app/chat/page.jsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import api from '@/lib/api';
import { format, isValid } from 'date-fns';
import { Send, Search, MoreVertical, Phone, Video, Loader2, MessageSquare, Plus, X, Trash2 } from 'lucide-react';
import Image from 'next/image';

const safeFormatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return isValid(date) ? format(date, 'HH:mm') : '';
};

const MessageBubble = ({ message, isMe }) => (
  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
    <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm relative ${
      isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
    }`}>
      <p className="text-sm leading-relaxed">{message.content}</p>
      <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
        <span>{safeFormatTime(message.createdAt)}</span>
        {isMe && <span>{message.isRead ? '✓✓' : '✓'}</span>}
      </div>
    </div>
  </div>
);

export default function ChatPage() {
  const { 
    conversations, activeConversation, messages, loading, isConnected, 
    selectConversation, sendMessage, startConversation, deleteConversation,
    currentUser, isRecipientTyping, handleTypingInput
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecipientTyping]);

  useEffect(() => {
    if (showNewChatModal) {
      setLoadingFriends(true);
      api.get('/api/social/friends') 
        .then(res => setFriends(res.data.data || []))
        .catch(err => console.error("Error cargando amigos", err))
        .finally(() => setLoadingFriends(false));
    }
  }, [showNewChatModal]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleStartChat = async (friendId) => {
      await startConversation(friendId);
      setShowNewChatModal(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary-600 w-10 h-10" /></div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative font-sans">
      
      {/* SIDEBAR */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col min-w-[320px] shadow-xl z-20">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Mensajes</h1>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isConnected ? 'bg-green-500 shadow-green-500/50 shadow-sm' : 'bg-red-500'}`} title={isConnected ? 'Conectado' : 'Desconectado'} />
            <button onClick={() => setShowNewChatModal(true)} className="p-2 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 transition-all active:scale-95">
                <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="relative group">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input type="text" placeholder="Buscar conversaciones..." className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent border rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary-300 transition-all" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {(!conversations || conversations.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-300 mb-4" />
                <p className="font-medium text-gray-500">Sin conversaciones recientes</p>
            </div>
          ) : (
            <div className="flex flex-col">
                {conversations.map((chat) => (
                <div key={chat.id} onClick={() => selectConversation(chat)} className={`group flex items-center p-4 cursor-pointer transition-all border-l-4 relative ${activeConversation?.id === chat.id ? 'bg-blue-50/50 border-l-primary-500' : 'border-l-transparent hover:bg-gray-50'}`}>
                    <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shadow-sm">
                            {chat.otherUser?.avatarUrl ? (
                            <Image src={chat.otherUser.avatarUrl} alt={chat.otherUser.username} width={48} height={48} className="object-cover w-full h-full" />
                            ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary-600 font-bold text-lg bg-white">
                                {chat.otherUser?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="ml-4 flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                            <h3 className="text-sm font-semibold text-gray-700 truncate">{chat.otherUser?.username || 'Usuario'}</h3>
                            {chat.lastMessageAt && <span className="text-xs text-gray-400 shrink-0 font-medium">{safeFormatTime(chat.lastMessageAt)}</span>}
                        </div>
                        <div className="flex justify-between items-center h-5">
                            <p className={`text-sm truncate pr-2 ${chat.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{chat.lastMessage?.content || "Nueva conversación"}</p>
                            {chat.unreadCount > 0 && <span className="bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{chat.unreadCount}</span>}
                        </div>
                    </div>

                    <button onClick={(e) => deleteConversation(chat.id, e)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white text-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-10">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-[#f0f2f5] relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

        {activeConversation ? (
          <>
            <div className="h-16 bg-white flex items-center justify-between px-6 shadow-sm z-10 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shadow-sm border border-gray-100">
                    {activeConversation.otherUser?.avatarUrl ? (
                      <Image src={activeConversation.otherUser.avatarUrl} alt="User" width={40} height={40} className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-600 font-bold">
                          {activeConversation.otherUser?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 leading-tight text-lg">{activeConversation.otherUser?.username}</h2>
                  {isRecipientTyping ? (
                    <p className="text-xs text-primary-600 font-bold animate-pulse">escribiendo...</p>
                  ) : (
                    <p className="text-xs text-green-600 flex items-center gap-1.5 font-medium">En línea</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400">
                <button className="p-2.5 hover:bg-gray-100 rounded-full"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 z-0 scrollbar-thin scrollbar-thumb-gray-300">
              {messages.map((msg, index) => (
                  <MessageBubble key={msg.id || index} message={msg} isMe={msg.senderId === currentUser?.id} />
              ))}
              
              {isRecipientTyping && (
                  <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-gray-100 flex gap-1 items-center w-16 h-10 justify-center">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200 z-10">
              <form onSubmit={handleSend} className="flex items-center gap-3 max-w-5xl mx-auto bg-gray-100 rounded-full px-2 py-2 border border-transparent focus-within:border-primary-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary-50 transition-all">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); handleTypingInput(); }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-transparent text-gray-800 px-4 py-2 focus:outline-none"
                />
                <button type="submit" disabled={!inputText.trim()} className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 transition-all shadow-md active:scale-95">
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="w-16 h-16 text-primary-200 mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tu Mensajería</h2>
            <p className="text-gray-500 max-w-xs mx-auto">Selecciona una conversación de la lista o inicia un nuevo chat con tus amigos.</p>
          </div>
        )}
      </div>

      {/* MODAL NUEVO CHAT */}
      {showNewChatModal && (
        <div className="absolute inset-0 bg-gray-900/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-gray-800">Nuevo Mensaje</h2>
                    <button onClick={() => setShowNewChatModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                    {loadingFriends ? (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                            <Loader2 className="animate-spin text-primary-500 w-8 h-8" />
                        </div>
                    ) : friends.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <p className="text-gray-500">No tienes amigos agregados.</p>
                        </div>
                    ) : ( 
                        <div className="space-y-1">
                            {friends.map((friend, index) => {
                                // ✅ CORRECCIÓN FINAL: Definir profile DENTRO del map
                                const profile = friend.profile || {};
                                const targetId = friend.friendId || profile.userId || profile.id; // Buscar ID valido

                                return (
                                    <div 
                                        key={friend.id || index} 
                                        onClick={() => {
                                            if(targetId) handleStartChat(targetId);
                                            else console.error("ID no encontrado para chat", friend);
                                        }} 
                                        className="flex items-center gap-4 p-3 hover:bg-primary-50 rounded-xl cursor-pointer transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200 shadow-sm">
                                            {profile.avatarUrl ? (
                                                <Image src={profile.avatarUrl} width={48} height={48} alt={profile.username} className="object-cover w-full h-full" />
                                            ) : (
                                                <span className="text-primary-600 font-bold text-lg">
                                                    {profile.username?.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-800 truncate">{profile.username}</p>
                                            <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}