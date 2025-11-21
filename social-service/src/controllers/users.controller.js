// src/controllers/user.controller.js

const usersService = require('../services/users.service');

/**
 * Buscar usuarios por username
 * GET /users/search?q=username&page=1&limit=20
 */
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const token = req.headers.authorization;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda (q)'
      });
    }

    const result = await usersService.searchUsers(q, page, limit, token);

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Usuarios encontrados'
    });

  } catch (error) {
    console.error('Error en búsqueda de usuarios:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener perfil público de un usuario
 * GET /users/:userId
 */
const getUserPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const token = req.headers.authorization;

    const profile = await usersService.getUserPublicProfile(userId, token);

    return res.status(200).json({
      success: true,
      data: profile,
      message: 'Perfil obtenido correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo perfil público:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  searchUsers,
  getUserPublicProfile
};


//const { searchUsers, getUserProfile } = require('../utils/apiClient');

/**
 * Buscar usuarios por username
 * GET /social/users/search?q=username
 */
/*
const searchUsersByUsername = async (req, res) => {
  try {
    const { q } = req.query;
    const token = req.headers.authorization;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda'
      });
    }

    // Llamar al user-service para buscar usuarios
    const result = await searchUsers(q, token);

    return res.status(200).json({
      success: true,
      data: result.data || result,
      message: 'Usuarios encontrados'
    });

  } catch (error) {
    console.error('Error en búsqueda de usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al buscar usuarios',
      error: error.message
    });
  }
};

/**
 * Obtener perfil público de un usuario
 * GET /social/users/:id
 */
/*
const getUserPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization;

    // Obtener perfil desde user-service
    const profile = await getUserProfile(id, token);

    // Filtrar solo información pública
    const publicProfile = {
      id: profile.data.id || id,
      username: profile.data.username,
      nombre: profile.data.nombre,
      apellido: profile.data.apellido,
      bio: profile.data.bio,
      avatarUrl: profile.data.avatarUrl,
      // Solo mostrar ubicación si el perfil lo permite
      pais: profile.data.showLocation ? profile.data.pais : null,
      ciudad: profile.data.showLocation ? profile.data.ciudad : null,
      // Solo mostrar stats si el perfil lo permite
      stats: profile.data.showStats ? {
        totalBooksRead: profile.data.totalBooksRead,
        totalPagesRead: profile.data.totalPagesRead
      } : null
    };

    return res.status(200).json({
      success: true,
      data: publicProfile,
      message: 'Perfil obtenido correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo perfil público:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener perfil de usuario',
      error: error.message
    });
  }
};

module.exports = {
  searchUsersByUsername,
  getUserPublicProfile
};

*/