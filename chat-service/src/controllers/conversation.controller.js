// src/controllers/conversation.controller.js
const conversationService = require('../services/conversation.service');
const messageService = require('../services/message.service');
const { getUserProfile } = require('../services/http/user.service');

/**
 * Obtener todas las conversaciones del usuario autenticado
 * GET /api/conversations
 */
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Obtener conversaciones de la BD local
    const conversations = await conversationService.getUserConversations(userId);

    // 2. Recolectar todos los IDs de los "otros usuarios"
    const otherUserIds = conversations.map(c => 
      c.participant1Id === userId ? c.participant2Id : c.participant1Id
    );
    
    // Eliminar duplicados por si acaso
    const uniqueIds = [...new Set(otherUserIds)];

    // 3. ✅ OPTIMIZACIÓN: Una sola petición HTTP para traer todos los perfiles
    let profilesMap = new Map();
    if (uniqueIds.length > 0) {
        try {
            const profilesData = await getUserProfiles(uniqueIds, req.headers.authorization);
            // Asumiendo que devuelve un array, creamos un mapa para acceso rápido
            // Ajusta esto según la estructura exacta de respuesta de tu user-service
            const profilesArray = profilesData.data || profilesData; 
            profilesArray.forEach(p => profilesMap.set(p.userId || p.id, p));
        } catch (error) {
            console.warn("⚠️ No se pudieron cargar perfiles batch");
        }
    }

    // 4. Enriquecer datos en memoria (Rapidísimo ⚡)
    const enrichedConversations = conversations.map((conversation) => {
      const otherUserId = conversation.participant1Id === userId 
        ? conversation.participant2Id 
        : conversation.participant1Id;

      const otherUserProfile = profilesMap.get(otherUserId) || { username: 'Usuario', avatarUrl: null };

      return {
        id: conversation.id,
        otherUser: {
          id: otherUserId,
          ...otherUserProfile,
        },
        lastMessage: conversation.messages[0] || null,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: conversation.readStatus[0]?.unreadCount || 0,
        createdAt: conversation.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedConversations,
    });
  } catch (error) {
    console.error('❌ Error en getUserConversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo conversaciones',
    });
  }
};

/**
 * Obtener o crear conversación con un amigo
 * GET /api/conversations/:friendId
 */
const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    const conversation = await conversationService.getOrCreateConversation(userId, friendId);

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('❌ Error en getOrCreateConversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo conversación',
    });
  }
};

/**
 * Marcar conversación como leída
 * PUT /api/conversations/:conversationId/read
 */
const markConversationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.conversationId);

    // Marcar todos los mensajes como leídos
    await messageService.markAllMessagesAsRead(conversationId, userId);

    // Resetear contador de no leídos
    await conversationService.markConversationAsRead(conversationId, userId);

    res.status(200).json({
      success: true,
      message: 'Conversación marcada como leída',
    });
  } catch (error) {
    console.error('❌ Error en markConversationAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Error marcando conversación como leída',
    });
  }
};

module.exports = {
  getUserConversations,
  getOrCreateConversation,
  markConversationAsRead,
};