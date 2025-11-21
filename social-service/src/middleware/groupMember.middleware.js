// social-service/src/middleware/groupMember.middleware.js

const { prisma } = require('../config/database'); // ✅ Desestructurar prisma

/**
 * Verifica que el usuario sea miembro del grupo
 */
const isMember = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId); // ✅ Convertir a Int
    const userId = req.user.id; // ✅ Usar req.user.id (consistente con auth.middleware)

    // ✅ Validar que groupId sea un número válido
    if (isNaN(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de grupo inválido'
      });
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      include: {
        group: true // ✅ Incluir info del grupo
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'No eres miembro de este grupo',
      });
    }

    // ✅ Agregar membership al request para uso posterior
    req.membership = membership;
    req.group = membership.group;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica que el usuario sea admin del grupo
 */
const isAdmin = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId); // ✅ Convertir a Int
    const userId = req.user.id; // ✅ Usar req.user.id

    if (isNaN(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de grupo inválido'
      });
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      include: {
        group: true
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'No eres miembro de este grupo',
      });
    }

    if (membership.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden realizar esta acción',
      });
    }

    req.membership = membership;
    req.group = membership.group;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica que el usuario pueda subir libros al grupo
 */
const canUploadBooks = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId); // ✅ Convertir a Int
    const userId = req.user.id; // ✅ Usar req.user.id

    if (isNaN(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de grupo inválido'
      });
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      include: {
        group: true
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'No eres miembro de este grupo',
      });
    }

    // ✅ Admin o usuarios con permiso especial pueden subir libros
    if (membership.role !== 'ADMIN' && !membership.canUploadBooks) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para subir libros en este grupo',
      });
    }

    req.membership = membership;
    req.group = membership.group;
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isMember,
  isAdmin,
  canUploadBooks,
};

//const prisma = require('../config/database');

/**
 * Verifica que el usuario sea miembro del grupo
 */
/*
const isMember = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'No eres miembro de este grupo',
      });
    }

    // Agregar membership al request para uso posterior
    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica que el usuario sea admin del grupo
 */
/*
const isAdmin = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'No eres miembro de este grupo',
      });
    }

    if (membership.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden realizar esta acción',
      });
    }

    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica que el usuario pueda subir libros al grupo
 */
/*
const canUploadBooks = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'No eres miembro de este grupo',
      });
    }

    // Admin o usuarios con permiso especial pueden subir libros
    if (membership.role !== 'ADMIN' && !membership.canUploadBooks) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para subir libros en este grupo',
      });
    }

    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isMember,
  isAdmin,
  canUploadBooks,
};
*/