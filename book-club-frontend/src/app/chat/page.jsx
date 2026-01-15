'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import api from '@/lib/api'; // Necesitamos api para buscar amigos
import { format } from 'date-fns';
import { Send, Search, MoreVertical, Phone, Video, Loader2, MessageSquare, Plus, X } from 'lucide-react';
import Image from 'next/image';

export default function ChatPage() {
  const { 
    conversations, 
    activeConversation, 
    messages, 
    loading, 
    isConnected, 
    selectConversation, 
    sendMessage,
    startConversation, // Nueva función
    currentUser 
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cargar amigos al abrir el modal
  useEffect(() => {
    if (showNewChatModal) {
      setLoadingFriends(true);
      // Asumimos que el Gateway está en puerto 4000 y el social-service responde ahí
      api.get('http://localhost:4000/api/social/friends') 
        .then(res => {
            console.log("📦 DATA AMIGOS:", res.data.data); // 👈 ¡MIRA ESTO EN CONSOLA!
            setFriends(res.data.data || []);
        })
        .catch(err => console.error("Error cargando amigos", err))
        .finally(() => setLoadingFriends(false));
    }
  }, [showNewChatModal]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleStartChat = async (friendId) => {
      await startConversation(friendId);
      setShowNewChatModal(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-600 w-8 h-8" /></div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      
      {/* --- SIDEBAR --- */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h1 className="text-xl font-bold text-gray-800">Mensajes</h1>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Conectado' : 'Desconectado'}></div>
            {/* Botón Nuevo Chat */}
            <button 
                onClick={() => setShowNewChatModal(true)}
                className="p-2 bg-primary-100 text-primary-600 rounded-full hover:bg-primary-200 transition-colors"
                title="Nuevo Chat"
            >
                <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar chats..." className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"/>
          </div>
        </div>

        {/* Lista de Chats */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
                <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                <p>No tienes conversaciones.</p>
                <button onClick={() => setShowNewChatModal(true)} className="text-primary-600 font-medium text-sm mt-2 hover:underline">
                    Inicia un chat nuevo
                </button>
            </div>
          ) : (
            conversations.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => selectConversation(chat)}
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${activeConversation?.id === chat.id ? 'bg-blue-50 border-l-4 border-l-primary-500' : ''}`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden">
                    {chat.otherUser.avatarUrl ? (
                      <Image src={chat.otherUser.avatarUrl} alt={chat.otherUser.username} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 font-bold text-lg">
                        {chat.otherUser.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{chat.otherUser.username}</h3>
                    {chat.lastMessageAt && (
                      <span className="text-xs text-gray-400 shrink-0">
                        {format(new Date(chat.lastMessageAt), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate pr-2 ${chat.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {chat.lastMessage?.content || "Nueva conversación"}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- VENTANA DE CHAT --- */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConversation ? (
          <>
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    {activeConversation.otherUser.avatarUrl ? (
                      <Image src={activeConversation.otherUser.avatarUrl} alt="User" width={40} height={40} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold">
                         {activeConversation.otherUser.username?.charAt(0)}
                      </div>
                    )}
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">{activeConversation.otherUser.username}</h2>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> En línea
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-500">
                <button className="p-2 hover:bg-gray-100 rounded-full"><Phone className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full"><Video className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                      isMe 
                        ? 'bg-primary-600 text-white rounded-br-none' 
                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                        {format(new Date(msg.createdAt), 'HH:mm')}
                        {isMe && <span className="ml-1">{msg.isRead ? '✓✓' : '✓'}</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-gray-100 text-gray-800 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-600">Tu Mensajería</h2>
            <p className="mt-2">Selecciona un chat para comenzar a escribir</p>
          </div>
        )}
      </div>

      {/* --- MODAL NUEVO CHAT --- */}
      {showNewChatModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 flex flex-col max-h-[80vh]">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Nuevo Mensaje</h2>
                    <button onClick={() => setShowNewChatModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4 border-b bg-gray-50">
                    <input className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500" placeholder="Buscar amigo..." />
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {loadingFriends ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary-500" /></div>
                    ) : friends.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No tienes amigos agregados aún.</p>
                    ) : ( 
                        friends.map((friend, index) => (
                            <div key={friend.id || `friend-${index}`} onClick={() => handleStartChat(friend.id)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    {friend.avatarUrl ? (
                                        <Image src={friend.avatarUrl} width={40} height={40} alt={friend.username} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">{friend.username?.charAt(0)}</div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{friend.username}</p>
                                    <p className="text-xs text-gray-500">{friend.email}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}