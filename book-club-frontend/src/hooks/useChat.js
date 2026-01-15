import { useState, useEffect, useCallback } from 'react'; // Eliminé useRef que no se usaba en export
import { io } from 'socket.io-client';
import api from '@/lib/api';
// Importación corregida con llaves
import { useAuthStore } from '@/stores/authStore';

// Asegúrate que este puerto coincida con tu chat-service
const CHAT_URL = 'http://localhost:3020'; 

export const useChat = () => {
    const { user, token } = useAuthStore();
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);

  
    // 1. Conectar Socket
    useEffect(() => {
        if (!token || !user) return;
        const newSocket = io(CHAT_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            path: '/socket.io'
        });
        newSocket.on('connect', () => { setIsConnected(true); });
        newSocket.on('disconnect', () => { setIsConnected(false); });
        newSocket.on('new_message', (message) => { handleIncomingMessage(message); });
        setSocket(newSocket);
        return () => { newSocket.disconnect(); };
    }, [token, user]);

  
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                // NOTA: Si usas Docker Gateway, cambia esto a http://localhost:4000/api/conversations
                const res = await api.get('http://localhost:3020/api/conversations'); 
                setConversations(res.data.data);
            } catch (error) {
                console.error("Error cargando conversaciones", error);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchConversations();
    }, [user]);

   
    const handleIncomingMessage = useCallback((message) => {
        if (activeConversation && activeConversation.id === message.conversationId) {
            setMessages((prev) => [...prev, message]);
        }
        setConversations((prev) => {
            const updated = prev.map(c => {
                if (c.id === message.conversationId) {
                    return {
                        ...c,
                        lastMessage: message,
                        lastMessageAt: message.createdAt,
                        unreadCount: activeConversation?.id === c.id ? c.unreadCount : (c.unreadCount || 0) + 1
                    };
                }
                return c;
            });
            return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        });
    }, [activeConversation]);

  
    const selectConversation = async (conversation) => {
        setActiveConversation(conversation);
        setMessages([]); 
        console.log("🔌 Uniéndose al room:", conversation.id); // Debug
        
        if(socket) {
            // Aseguramos que el ID sea numérico si el back lo espera numérico
            // O string si es string. En tu schema es Int (autoincrement).
            socket.emit('join_conversation', conversation.id); 
        }
        
        try {
            const res = await api.get(`http://localhost:3020/api/messages/${conversation.id}`);
            setMessages(res.data.data);
            setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, unreadCount: 0 } : c));
            api.put(`http://localhost:3020/api/conversations/${conversation.id}/read`);
        } catch (error) { console.error("Error cargando mensajes", error); }
    };

    
    const sendMessage = async (content) => {
        if (!socket || !activeConversation || !content.trim()) return;
        const optimisticMsg = {
            id: Date.now(), content, senderId: user.id, conversationId: activeConversation.id,
            createdAt: new Date().toISOString(), isRead: false, temp: true 
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        socket.emit('send_message', {
            conversationId: activeConversation.id,
            receiverId: activeConversation.otherUser.id, 
            content
        });
        setConversations(prev => {
            const updated = prev.map(c => c.id === activeConversation.id ? { ...c, lastMessage: optimisticMsg, lastMessageAt: new Date() } : c);
            return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        });
    };

    
    const startConversation = async (friendId) => {
        try {
            // Llamamos al endpoint getOrCreateConversation/:friendId
            const res = await api.get(`http://localhost:3020/api/conversations/${friendId}`);
            const conversation = res.data.data;

            // Formatear la data para que coincida con la estructura de la lista (necesitamos "otherUser")
            // Como el endpoint getOrCreate a veces devuelve datos crudos, necesitamos asegurar la estructura
            // NOTA: Tu backend getOrCreateConversation devuelve el objeto Conversation puro.
            // Necesitamos enriquecerlo o recargar la lista. 
            // Para simplificar, recargamos la lista completa o lo inyectamos si el back lo devolviera completo.
            
            // Truco rápido: Recargar la lista de conversaciones
            const listRes = await api.get('http://localhost:3020/api/conversations');
            setConversations(listRes.data.data);
            
            // Buscar la conversación recién creada en la nueva lista y seleccionarla
            const newConv = listRes.data.data.find(c => c.id === conversation.id);
            if (newConv) selectConversation(newConv);

            return true;
        } catch (error) {
            console.error("Error iniciando conversación:", error);
            return false;
        }
    };

    return {
        conversations,
        activeConversation,
        messages,
        loading,
        isConnected,
        selectConversation,
        sendMessage,
        startConversation,
        currentUser: user
    };
};