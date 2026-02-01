//src/hooks/useChat.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const SOCKET_URL = 'http://localhost:3020';

export const useChat = () => {
    const { user, accessToken, token: hookToken } = useAuthStore();
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [isRecipientTyping, setIsRecipientTyping] = useState(false);

    const activeConversationRef = useRef(activeConversation);
    const typingTimeoutRef = useRef(null);

    const getRawToken = () => {
        if (accessToken) return accessToken;
        if (hookToken) return hookToken;
        if (typeof window !== 'undefined') {
            try {
                const jsonStr = localStorage.getItem('auth-storage');
                if (jsonStr) {
                    const parsed = JSON.parse(jsonStr);
                    const t = parsed.state?.accessToken || parsed.state?.token;
                    if (t) return t;
                }
                const simple = localStorage.getItem('token');
                if (simple) return simple.replace(/['"]+/g, '');
            } catch (e) {}
        }
        return null;
    };

    useEffect(() => {
        activeConversationRef.current = activeConversation;
        setIsRecipientTyping(false);
    }, [activeConversation]);

    // --- SOCKET ---
    useEffect(() => {
        let socketInstance = null;
        const connectSocket = () => {
            const token = getRawToken();
            if (!token) return;
            if (socketInstance?.connected) return;

            socketInstance = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket'],
                path: '/socket.io',
                withCredentials: true
            });

            socketInstance.on('connect', () => {
                console.log("🟢 Chat Online:", socketInstance.id);
                setIsConnected(true);
            });
            socketInstance.on('disconnect', () => setIsConnected(false));
            socketInstance.on('new_message', (msg) => handleIncomingMessage(msg));
            socketInstance.on('user_typing', (data) => handleUserTyping(data));
            setSocket(socketInstance);
        };

        connectSocket();
        const timer = setTimeout(connectSocket, 500);
        return () => {
            clearTimeout(timer);
            if (socketInstance) socketInstance.disconnect();
        };
    }, [accessToken, hookToken]);

    // --- HANDLERS ---
    const handleIncomingMessage = useCallback((message) => {
        const current = activeConversationRef.current;
        if (current && String(current.id) === String(message.conversationId)) {
            setMessages(prev => {
                const exists = prev.find(m => m.id === message.id || (m.temp && m.content === message.content));
                if (exists) return prev;
                return [...prev, message];
            });
            api.put(`/api/conversations/${message.conversationId}/read`).catch(() => {});
            setIsRecipientTyping(false);
        }
        fetchConversations(); 
    }, []);

    const handleUserTyping = ({ conversationId, isTyping, userId }) => {
        const current = activeConversationRef.current;
        if (current && parseInt(conversationId) === parseInt(current.id) && userId !== user?.id) {
            setIsRecipientTyping(isTyping);
        }
    };

    // --- API ---
    const fetchConversations = useCallback(async () => {
        try {
            const res = await api.get('/api/conversations');
            const rawConversations = res.data.data || [];
            // Filtro anti-fantasmas
            const validConversations = rawConversations.filter(c => c.otherUser && c.otherUser.username);
            setConversations(validConversations);
        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => { fetchConversations(); }, [fetchConversations]);

    const selectConversation = async (conversation) => {
        setActiveConversation(conversation);
        setMessages([]);
        if(socket) socket.emit('join_conversation', conversation.id);
        
        try {
            const res = await api.get(`/api/messages/${conversation.id}`);
            setMessages(res.data.data || []);
            setConversations(prev => prev.map(c => 
                c.id === conversation.id ? { ...c, unreadCount: 0 } : c
            ));
            await api.put(`/api/conversations/${conversation.id}/read`);
        } catch (error) { console.error(error); }
    };

    const sendMessage = async (content) => {
        if (!socket || !activeConversation || !content.trim()) return;
        const tempId = `temp-${Date.now()}`;
        const msg = {
            id: tempId, content, senderId: user?.id, 
            conversationId: activeConversation.id, createdAt: new Date().toISOString(), 
            isRead: false, temp: true
        };
        setMessages(prev => [...prev, msg]);
        
        // Stop typing inmediato
        if (activeConversation.otherUser?.id) {
             socket.emit('typing_stop', { conversationId: activeConversation.id, receiverId: activeConversation.otherUser.id });
        }

        socket.emit('send_message', {
            conversationId: activeConversation.id,
            receiverId: activeConversation.otherUser?.id, // Safe access
            content, tempId
        });
    };

    const handleTypingInput = () => {
        // ✅ BLINDAJE: Si no hay usuario destino, no emitimos evento para evitar crash
        if (!socket || !activeConversation || !activeConversation.otherUser?.id) return;
        
        socket.emit('typing_start', { 
            conversationId: activeConversation.id, 
            receiverId: activeConversation.otherUser.id 
        });
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (activeConversationRef.current?.otherUser?.id) {
                socket.emit('typing_stop', { 
                    conversationId: activeConversationRef.current.id, 
                    receiverId: activeConversationRef.current.otherUser.id 
                });
            }
        }, 2000);
    };

    const startConversation = async (friendId) => {
        try {
            const res = await api.get(`/api/conversations/${friendId}`);
            const newConversation = res.data.data; 
            if (!newConversation) return false;

            setConversations(prev => {
                const exists = prev.find(c => c.id === newConversation.id);
                if (exists) return prev;
                return [newConversation, ...prev];
            });
            selectConversation(newConversation);
            return true;
        } catch (error) { 
            console.error("Error starting chat", error);
            return false; 
        }
    };

    const deleteConversation = async (conversationId) => {
        if (!confirm("¿Eliminar esta conversación?")) return;
        try {
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (activeConversation?.id === conversationId) {
                setActiveConversation(null);
                setMessages([]);
            }
            await api.delete(`/api/conversations/${conversationId}`);
            toast.success("Conversación eliminada");
        } catch (error) {
            console.error("Error deleting chat:", error);
            toast.error("Error al eliminar");
            fetchConversations();
        }
    };

    return {
        conversations, activeConversation, messages, loading, isConnected,
        selectConversation, sendMessage, startConversation, 
        deleteConversation, // ✅ AHORA SÍ ESTÁ EXPORTADA
        currentUser: user, isRecipientTyping, handleTypingInput
    };
};