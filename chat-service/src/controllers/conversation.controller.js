//chat-service/src/controllers/conversation.controller.js

const conversationService = require('../services/conversation.service');
const messageService = require('../services/message.service');
const { prisma } = require('../config/database'); 
const { getUserProfiles } = require('../services/http/user.service'); 

const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await conversationService.getUserConversations(userId);

    // Recolectar IDs para pedir perfiles
    const otherUserIds = [...new Set(conversations.map(c => 
      c.participant1Id === userId ? c.participant2Id : c.participant1Id
    ))];
    
    let profilesMap = new Map();
    if (otherUserIds.length > 0) {
        try {
            const profilesData = await getUserProfiles(otherUserIds, req.headers.authorization);
            const profilesArray = Array.isArray(profilesData) ? profilesData : (profilesData.data || []);
            profilesArray.forEach(p => profilesMap.set(p.userId || p.id, p));
        } catch (e) { console.warn("⚠️ Falló carga de perfiles batch"); }
    }

    const enriched = conversations.map((c) => {
      const otherId = c.participant1Id === userId ? c.participant2Id : c.participant1Id;
      const profile = profilesMap.get(otherId);
      return {
        id: c.id,
        otherUser: {
            id: otherId,
            username: profile?.username || 'Usuario',
            avatarUrl: profile?.avatarUrl || null,
            email: profile?.email
        },
        lastMessage: c.messages[0] || null,
        lastMessageAt: c.lastMessageAt,
        unreadCount: c.readStatus[0]?.unreadCount || 0,
      };
    });

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al listar chats' });
  }
};

const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    // 1. Crear/Obtener chat
    const conversation = await conversationService.getOrCreateConversation(userId, friendId);

    // 2. Buscar datos del amigo para que no salga "Desconocido"
    let otherUser = { id: friendId, username: 'Usuario', avatarUrl: null };
    try {
        const profilesData = await getUserProfiles([friendId], req.headers.authorization);
        const profilesArray = Array.isArray(profilesData) ? profilesData : (profilesData.data || []);
        const profile = profilesArray.find(p => p.userId === friendId || p.id === friendId);
        if (profile) {
            otherUser = { 
                id: friendId, 
                username: profile.username, 
                avatarUrl: profile.avatarUrl 
            };
        }
    } catch (e) {}

    res.status(200).json({
      success: true,
      data: { ...conversation, otherUser, lastMessage: null, unreadCount: 0 }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al iniciar chat' });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const id = parseInt(req.params.conversationId);
    // Borrado en cascada manual
    await prisma.message.deleteMany({ where: { conversationId: id } });
    try { await prisma.conversationReadStatus.deleteMany({ where: { conversationId: id } }); } catch(e){}
    try { await prisma.typingIndicator.deleteMany({ where: { conversationId: id } }); } catch(e){}
    
    await prisma.conversation.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Chat eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al eliminar' });
  }
};

// Necesitas exportar markConversationAsRead si lo usas en rutas, o borrar la ruta.
// Asumo que lo tienes, si no, copia el del paso anterior.
const markConversationAsRead = async (req, res) => {
    /* Tu lógica existente o copy-paste del anterior */
    res.json({success: true});
}; 

module.exports = {
  getUserConversations,
  getOrCreateConversation,
  deleteConversation,
  markConversationAsRead
};