// src/controllers/forum.controller.js

const forumService = require('../services/forum.service');

/**
 * Crear publicación en el foro
 * POST /groups/:groupId/posts
 * Body: { content, bookId?, bookTitle?, bookAuthor?, bookCoverUrl?, uploadedFileUrl?, fileType? }
 */
const createPost = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    if (!req.body.content || req.body.content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El contenido de la publicación es requerido'
      });
    }

    const post = await forumService.createPost(parseInt(groupId), userId, req.body, token);

    return res.status(201).json({
      success: true,
      data: post,
      message: 'Publicación creada correctamente'
    });

  } catch (error) {
    console.error('Error creando publicación:', error);
    const statusCode = error.message.includes('miembro') ? 403 : 
                       error.message.includes('permiso') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener publicaciones del grupo
 * GET /groups/:groupId/posts?page=1&limit=20
 */
const getGroupPosts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await forumService.getGroupPosts(parseInt(groupId), userId, page, limit, token);

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Publicaciones obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo publicaciones:', error);
    const statusCode = error.message.includes('miembros') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener detalle de un post
 * GET /groups/:groupId/posts/:postId
 */
const getPostById = async (req, res) => {
  try {
    const { groupId, postId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    const post = await forumService.getPostById(parseInt(postId), userId, token);

    return res.status(200).json({
      success: true,
      data: post,
      message: 'Post obtenido correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo post:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 
                       error.message.includes('miembros') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Crear comentario en publicación
 * POST /groups/:groupId/posts/:postId/comments
 * Body: { content, parentCommentId? }
 */
const createComment = async (req, res) => {
  try {
    const { groupId, postId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    if (!req.body.content || req.body.content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El contenido del comentario es requerido'
      });
    }

    const comment = await forumService.createComment(parseInt(postId), userId, req.body, token);

    return res.status(201).json({
      success: true,
      data: comment,
      message: 'Comentario creado correctamente'
    });

  } catch (error) {
    console.error('Error creando comentario:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 
                       error.message.includes('miembros') ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Obtener comentarios de una publicación
 * GET /groups/:groupId/posts/:postId/comments
 */
const getPostComments = async (req, res) => {
  try {
    const { groupId, postId } = req.params;
    const userId = req.user.id;
    const token = req.headers.authorization;

    const comments = await forumService.getPostComments(parseInt(postId), userId, token);

    return res.status(200).json({
      success: true,
      data: comments,
      count: comments.length,
      message: 'Comentarios obtenidos correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 
                       error.message.includes('miembros') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Eliminar post
 * DELETE /groups/:groupId/posts/:postId
 */
const deletePost = async (req, res) => {
  try {
    const { groupId, postId } = req.params;
    const userId = req.user.id;

    const result = await forumService.deletePost(parseInt(postId), userId);

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error eliminando post:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 
                       error.message.includes('permiso') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Eliminar comentario
 * DELETE /groups/:groupId/posts/:postId/comments/:commentId
 */
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const result = await forumService.deleteComment(parseInt(commentId), userId);

    return res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error eliminando comentario:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 
                       error.message.includes('permiso') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createPost,
  getGroupPosts,
  getPostById,
  createComment,
  getPostComments,
  deletePost,
  deleteComment
};


//const prisma = require('../config/database');

/**
 * Helper: Verificar si el usuario es miembro del grupo
 */
/*
const checkGroupMembership = async (groupId, userId) => {
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId
      }
    }
  });
  return membership;
};

/**
 * Crear publicación en el foro
 * POST /social/groups/:id/posts
 * Body: { title?, content, bookId?, bookTitle?, bookAuthor?, bookCoverUrl? }
 */
/*
const createPost = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;
    const { title, content, bookId, bookTitle, bookAuthor, bookCoverUrl } = req.body;

    // Validar contenido
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El contenido de la publicación es requerido'
      });
    }

    // Verificar membresía
    const membership = await checkGroupMembership(groupId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro del grupo para publicar'
      });
    }

    // Crear publicación
    const post = await prisma.groupPost.create({
      data: {
        groupId,
        userId,
        title: title?.trim() || null,
        content: content.trim(),
        bookId: bookId || null,
        bookTitle: bookTitle || null,
        bookAuthor: bookAuthor || null,
        bookCoverUrl: bookCoverUrl || null
      }
    });

    // Incrementar contador de posts del grupo
    await prisma.group.update({
      where: { id: groupId },
      data: {
        totalPosts: {
          increment: 1
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: post,
      message: 'Publicación creada correctamente'
    });

  } catch (error) {
    console.error('Error creando publicación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear publicación',
      error: error.message
    });
  }
};

/**
 * Obtener publicaciones del grupo
 * GET /social/groups/:id/posts?page=1&limit=10
 */
/*
const getGroupPosts = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verificar membresía
    const membership = await checkGroupMembership(groupId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro del grupo para ver las publicaciones'
      });
    }

    // Obtener posts con comentarios
    const [posts, total] = await Promise.all([
      prisma.groupPost.findMany({
        where: { groupId },
        skip,
        take: limit,
        orderBy: [
          { isPinned: 'desc' }, // Primero los fijados
          { createdAt: 'desc' }  // Luego por fecha
        ],
        include: {
          _count: {
            select: {
              comments: true
            }
          }
        }
      }),
      prisma.groupPost.count({
        where: { groupId }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      message: 'Publicaciones obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo publicaciones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener publicaciones',
      error: error.message
    });
  }
};

/**
 * Crear comentario en publicación
 * POST /social/groups/:id/posts/:postId/comments
 * Body: { content, parentCommentId? }
 */
/*
const createComment = async (req, res) => {
  try {
    const { id: groupId, postId } = req.params;
    const userId = req.user.id;
    const { content, parentCommentId } = req.body;

    // Validar contenido
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El contenido del comentario es requerido'
      });
    }

    // Verificar membresía
    const membership = await checkGroupMembership(groupId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro del grupo para comentar'
      });
    }

    // Verificar que el post existe y pertenece al grupo
    const post = await prisma.groupPost.findFirst({
      where: {
        id: postId,
        groupId
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Crear comentario
    const comment = await prisma.groupComment.create({
      data: {
        postId,
        userId,
        content: content.trim(),
        parentCommentId: parentCommentId || null
      }
    });

    // Incrementar contador de comentarios del post
    await prisma.groupPost.update({
      where: { id: postId },
      data: {
        commentsCount: {
          increment: 1
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: comment,
      message: 'Comentario creado correctamente'
    });

  } catch (error) {
    console.error('Error creando comentario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear comentario',
      error: error.message
    });
  }
};

/**
 * Obtener comentarios de una publicación
 * GET /social/groups/:id/posts/:postId/comments
 */
/*
const getPostComments = async (req, res) => {
  try {
    const { id: groupId, postId } = req.params;
    const userId = req.user.id;

    // Verificar membresía
    const membership = await checkGroupMembership(groupId, userId);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro del grupo para ver los comentarios'
      });
    }

    // Obtener comentarios
    const comments = await prisma.groupComment.findMany({
      where: { postId },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Organizar comentarios en árbol (padres e hijos)
    const commentMap = new Map();
    const rootComments = [];

    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach(comment => {
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return res.status(200).json({
      success: true,
      data: rootComments,
      count: comments.length,
      message: 'Comentarios obtenidos correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener comentarios',
      error: error.message
    });
  }
};

module.exports = {
  createPost,
  getGroupPosts,
  createComment,
  getPostComments
};
*/