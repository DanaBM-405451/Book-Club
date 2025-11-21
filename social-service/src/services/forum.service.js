// social-service/src/services/forum.service.js

const { prisma } = require('../config/database');
const externalService = require('./external.service');
const { createPaginatedResponse, sanitizeText, createNotificationMetadata } = require('../utils/helpers');

class ForumService {
  /**
   * Crear un post en el foro del grupo
   * Historia 5.4: Foro de grupo
   */
  async createPost(groupId, userId, data, token) {
    try {
      const { content, bookId, bookTitle, bookAuthor, bookCoverUrl, uploadedFileUrl, fileType } = data;

      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Debes ser miembro del grupo para crear posts');
      }

      // Si se adjunta un libro, validar permisos
      if (bookId || uploadedFileUrl) {
        // Si es admin o tiene permiso especial, puede subir libros
        if (membership.role !== 'ADMIN' && !membership.canUploadBooks) {
          throw new Error('No tienes permiso para adjuntar libros');
        }

        // Si hay bookId, verificar que el libro existe
        if (bookId) {
          try {
            await externalService.getBookById(bookId, token);
          } catch (error) {
            console.warn('No se pudo validar el libro:', error.message);                    
          }
        }
      }

      // Sanitizar contenido
      const sanitizedContent = sanitizeText(content);

      // Crear el post
      const post = await prisma.groupPost.create({
        data: {
          groupId,
          userId,
          content: sanitizedContent,
          bookId,
          bookTitle,
          bookAuthor,
          bookCoverUrl,
          uploadedFileUrl,
          fileType,
        },
      });

      // Notificar a otros miembros del grupo
      await this.notifyGroupMembers(
        groupId,
        userId,
        'NEW_POST',
        'Nuevo post en el grupo',
        `Se ha publicado un nuevo post`,
        { postId: post.id, groupId }
      );

      // Otorgar puntos XP
      await externalService.awardXP(
        userId,
        5,
        'Crear post en grupo',
        token
      );

      return post;
    } catch (error) {
      console.error('Error creando post:', error);
      throw error;
    }
  }

  /**
   * Listar posts de un grupo
   * Historia 5.4: Foro de grupo
   */
  async getGroupPosts(groupId, userId, page = 1, limit = 20, token) {
    try {
      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden ver el foro del grupo');
      }

      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        prisma.groupPost.findMany({
          where: {
            groupId,
            isDeleted: false,
          },
          skip,
          take: limit,
          orderBy: [
            { isPinned: 'desc' }, // Posts fijados primero
            { createdAt: 'desc' }, // Más recientes primero
          ],
          include: {
            _count: {
              select: {
                comments: true,
              },
            },
          },
        }),
        prisma.groupPost.count({
          where: {
            groupId,
            isDeleted: false,
          },
        }),
      ]);

      // Obtener perfiles de los autores
      const authorIds = [...new Set(posts.map(p => p.userId))];
      const authors = await externalService.getUserProfiles(authorIds, token);
      const authorMap = new Map(authors.map(a => [a.userId, a]));

      // Si hay libros adjuntos, obtener su información
      const bookIds = posts
        .filter(p => p.bookId)
        .map(p => p.bookId);
      
      const booksData = [];
      for (const bookId of [...new Set(bookIds)]) {
        try {
          const book = await externalService.getBookById(bookId, token);
          booksData.push(book);
        } catch (error) {
          console.error(`Error obteniendo libro ${bookId}:`, error);
        }
      }
      
      const bookMap = new Map(booksData.map(b => [b.id, b]));

      // Mapear posts con información adicional
      const postsWithInfo = posts.map(post => ({
        ...post,
        author: authorMap.get(post.userId) || null,
        book: post.bookId ? bookMap.get(post.bookId) || null : null,
        commentsCount: post._count.comments,
      }));

      return createPaginatedResponse(postsWithInfo, page, limit, total);
    } catch (error) {
      console.error('Error obteniendo posts del grupo:', error);
      throw error;
    }
  }

  /**
   * Obtener un post específico con sus comentarios
   * Historia 5.4: Foro de grupo
   */
  async getPostById(postId, userId, token) {
    try {
      const post = await prisma.groupPost.findUnique({
        where: { id: postId },
        include: {
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });

      if (!post || post.isDeleted) {
        throw new Error('Post no encontrado');
      }

      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: post.groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden ver este post');
      }

      // Obtener perfil del autor
      const author = await externalService.getUserProfile(post.userId, token);

      // Si hay libro adjunto, obtener su información
      let book = null;
      if (post.bookId) {
        try {
          book = await externalService.getBookById(post.bookId, token);
        } catch (error) {
          console.error(`Error obteniendo libro ${post.bookId}:`, error);
        }
      }

      return {
        ...post,
        author,
        book,
        commentsCount: post._count.comments,
      };
    } catch (error) {
      console.error('Error obteniendo post:', error);
      throw error;
    }
  }

  /**
   * Crear comentario en un post
   * Historia 5.4: Foro de grupo (comentarios anidados)
   */
  async createComment(postId, userId, data, token) {
    try {
      const { content, parentCommentId } = data;

      // Obtener el post
      const post = await prisma.groupPost.findUnique({
        where: { id: postId },
      });

      if (!post || post.isDeleted) {
        throw new Error('Post no encontrado');
      }

      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: post.groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden comentar');
      }

      // Si es una respuesta, verificar que el comentario padre existe
      if (parentCommentId) {
        const parentComment = await prisma.groupComment.findUnique({
          where: { id: parentCommentId },
        });

        if (!parentComment || parentComment.postId !== postId) {
          throw new Error('Comentario padre no válido');
        }
      }

      // Sanitizar contenido
      const sanitizedContent = sanitizeText(content);

      // Crear el comentario
      const comment = await prisma.groupComment.create({
        data: {
          postId,
          userId,
          content: sanitizedContent,
          parentCommentId,
        },
      });

      // Notificar al autor del post (si no es el mismo usuario)
      if (post.userId !== userId) {
        await this.createNotification(
          post.userId,
          userId, // ✅ senderId
          'NEW_COMMENT',
          'Nuevo comentario en tu post',
          `Alguien comentó en tu publicación`,
          { postId, commentId: comment.id, groupId: post.groupId }
        );
      }

      // Otorgar puntos XP
      await externalService.awardXP(
        userId,
        2,
        'Comentar en post de grupo',
        token
      );

      return comment;
    } catch (error) {
      console.error('Error creando comentario:', error);
      throw error;
    }
  }

  /**
   * Obtener comentarios de un post (con anidamiento)
   * Historia 5.4: Foro de grupo
   */
  async getPostComments(postId, userId, token) {
    try {
      // Obtener el post
      const post = await prisma.groupPost.findUnique({
        where: { id: postId },
      });

      if (!post || post.isDeleted) {
        throw new Error('Post no encontrado');
      }

      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: post.groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden ver los comentarios');
      }

      // Obtener todos los comentarios
      const comments = await prisma.groupComment.findMany({
        where: {
          postId,
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Obtener perfiles de los autores
      const authorIds = [...new Set(comments.map(c => c.userId))];
      const authors = await externalService.getUserProfiles(authorIds, token);
      const authorMap = new Map(authors.map(a => [a.userId, a]));

      // Organizar comentarios en estructura anidada
      const commentsWithAuthors = comments.map(comment => ({
        ...comment,
        author: authorMap.get(comment.userId) || null,
        replies: [],
      }));

      // Crear mapa de comentarios por ID
      const commentsMap = new Map(commentsWithAuthors.map(c => [c.id, c]));

      // Organizar en árbol (comentarios de nivel superior y sus respuestas)
      const topLevelComments = [];

      commentsWithAuthors.forEach(comment => {
        if (comment.parentCommentId) {
          // Es una respuesta, agregarlo al padre
          const parent = commentsMap.get(comment.parentCommentId);
          if (parent) {
            parent.replies.push(comment);
          }
        } else {
          // Es un comentario de nivel superior
          topLevelComments.push(comment);
        }
      });

      return topLevelComments;
    } catch (error) {
      console.error('Error obteniendo comentarios:', error);
      throw error;
    }
  }

  /**
   * Eliminar post (solo autor o admin)
   */
  async deletePost(postId, userId) {
    try {
      const post = await prisma.groupPost.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new Error('Post no encontrado');
      }

      // Verificar permisos: autor del post o admin del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: post.groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('No tienes permiso para eliminar este post');
      }

      const canDelete = post.userId === userId || membership.role === 'ADMIN';

      if (!canDelete) {
        throw new Error('Solo el autor o el administrador pueden eliminar este post');
      }

      // Soft delete
      await prisma.groupPost.update({
        where: { id: postId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return { message: 'Post eliminado exitosamente' };
    } catch (error) {
      console.error('Error eliminando post:', error);
      throw error;
    }
  }

  /**
   * Eliminar comentario (solo autor o admin)
   */
  async deleteComment(commentId, userId) {
    try {
      const comment = await prisma.groupComment.findUnique({
        where: { id: commentId },
        include: {
          post: true,
        },
      });

      if (!comment) {
        throw new Error('Comentario no encontrado');
      }

      // Verificar permisos
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: comment.post.groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('No tienes permiso para eliminar este comentario');
      }

      const canDelete = comment.userId === userId || membership.role === 'ADMIN';

      if (!canDelete) {
        throw new Error('Solo el autor o el administrador pueden eliminar este comentario');
      }

      // Soft delete
      await prisma.groupComment.update({
        where: { id: commentId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return { message: 'Comentario eliminado exitosamente' };
    } catch (error) {
      console.error('Error eliminando comentario:', error);
      throw error;
    }
  }

  /**
   * Notificar a todos los miembros del grupo (excepto el autor de la acción)
   */
  async notifyGroupMembers(groupId, excludeUserId, type, title, message, metadata = {}) {
    try {
      const members = await prisma.groupMember.findMany({
        where: {
          groupId,
          userId: { not: excludeUserId },
        },
        select: {
          userId: true,
        },
      });

      const notifications = members.map(member =>
        this.createNotification(member.userId, excludeUserId, type, title, message, metadata)
      );

      await Promise.all(notifications);
    } catch (error) {
      console.error('Error notificando a miembros del grupo:', error);
    }
  }

  /**
   * Crear notificación
   */
  async createNotification(userId, senderId, type, title, message, metadata = {}) { // ✅ Agregado senderId
    try {
      return await prisma.notification.create({
        data: {
          userId,
          senderId, // ✅ Agregado
          type,
          title,
          message,
          metadata: createNotificationMetadata(type, metadata),
        },
      });
    } catch (error) {
      console.error('Error creando notificación:', error);
      return null;
    }
  }
}

module.exports = new ForumService();
/*
const prisma = require('../config/database');
const externalService = require('./external.service');
const { createPaginatedResponse, sanitizeText, createNotificationMetadata } = require('../utils/helpers');

class ForumService {
  /**
   * Crear un post en el foro del grupo
   * Historia 5.4: Foro de grupo
   */
  /*
  async createPost(groupId, userId, data, token) {
    try {
      const { title, content, bookId, bookSource } = data;

      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Debes ser miembro del grupo para crear posts');
      }

      // Si se adjunta un libro, validar permisos
      if (bookId) {
        // Si es admin o tiene permiso especial, puede subir libros
        if (membership.role !== 'ADMIN' && !membership.canUploadBooks) {
          throw new Error('No tienes permiso para adjuntar libros');
        }

        // Verificar que el libro existe
        try {
          await externalService.getBookById(bookId, token);
        } catch (error) {
          throw new Error('El libro especificado no existe');
        }
      }

      // Sanitizar contenido
      const sanitizedContent = sanitizeText(content);
      const sanitizedTitle = title ? sanitizeText(title) : null;

      // Crear el post
      const post = await prisma.groupPost.create({
        data: {
          groupId,
          userId,
          title: sanitizedTitle,
          content: sanitizedContent,
          bookId,
          bookSource,
        },
      });

      // Actualizar contador de posts del grupo
      await prisma.group.update({
        where: { id: groupId },
        data: {
          totalPosts: {
            increment: 1,
          },
        },
      });

      // Notificar a otros miembros del grupo
      await this.notifyGroupMembers(
        groupId,
        userId,
        'NEW_POST',
        'Nuevo post en el grupo',
        `Se ha publicado un nuevo post`,
        { postId: post.id, groupId }
      );

      // Otorgar puntos XP
      await externalService.awardPoints(
        userId,
        5,
        'Crear post en grupo',
        token
      );

      return post;
    } catch (error) {
      console.error('Error creando post:', error);
      throw error;
    }
  }

  /**
   * Listar posts de un grupo
   * Historia 5.4: Foro de grupo
   */
  /*
  async getGroupPosts(groupId, userId, page = 1, limit = 20, token) {
    try {
      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden ver el foro del grupo');
      }

      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        prisma.groupPost.findMany({
          where: {
            groupId,
            isDeleted: false,
          },
          skip,
          take: limit,
          orderBy: [
            { isPinned: 'desc' }, // Posts fijados primero
            { createdAt: 'desc' }, // Más recientes primero
          ],
          include: {
            _count: {
              select: {
                comments: true,
                likes: true,
              },
            },
          },
        }),
        prisma.groupPost.count({
          where: {
            groupId,
            isDeleted: false,
          },
        }),
      ]);

      // Obtener perfiles de los autores
      const authorIds = [...new Set(posts.map(p => p.userId))];
      const authors = await externalService.getMultipleProfiles(authorIds, token);
      const authorMap = new Map(authors.map(a => [a.userId, a]));

      // Si hay libros adjuntos, obtener su información
      const bookIds = posts
        .filter(p => p.bookId)
        .map(p => p.bookId);
      
      const booksData = [];
      for (const bookId of bookIds) {
        try {
          const book = await externalService.getBookById(bookId, token);
          booksData.push(book);
        } catch (error) {
          console.error(`Error obteniendo libro ${bookId}:`, error);
        }
      }
      
      const bookMap = new Map(booksData.map(b => [b.id, b]));

      // Verificar si el usuario dio like a cada post
      const userLikes = await prisma.groupPostLike.findMany({
        where: {
          postId: { in: posts.map(p => p.id) },
          userId,
        },
        select: {
          postId: true,
        },
      });
      
      const likedPostIds = new Set(userLikes.map(l => l.postId));

      // Mapear posts con información adicional
      const postsWithInfo = posts.map(post => ({
        ...post,
        author: authorMap.get(post.userId) || null,
        book: post.bookId ? bookMap.get(post.bookId) || null : null,
        commentsCount: post._count.comments,
        likesCount: post._count.likes,
        isLikedByUser: likedPostIds.has(post.id),
      }));

      return createPaginatedResponse(postsWithInfo, page, limit, total);
    } catch (error) {
      console.error('Error obteniendo posts del grupo:', error);
      throw error;
    }
  }

  /**
   * Obtener un post específico con sus comentarios
   * Historia 5.4: Foro de grupo
   */
  /*
  async getPostById(postId, userId, token) {
    try {
      const post = await prisma.groupPost.findUnique({
        where: { id: postId },
        include: {
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      });

      if (!post || post.isDeleted) {
        throw new Error('Post no encontrado');
      }

      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: post.groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden ver este post');
      }

      // Obtener perfil del autor
      const author = await externalService.getUserProfile(post.userId, token);

      // Si hay libro adjunto, obtener su información
      let book = null;
      if (post.bookId) {
        try {
          book = await externalService.getBookById(post.bookId, token);
        } catch (error) {
          console.error(`Error obteniendo libro ${post.bookId}:`, error);
        }
      }

      // Verificar si el usuario dio like
      const userLike = await prisma.groupPostLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      return {
        ...post,
        author,
        book,
        commentsCount: post._count.comments,
        likesCount: post._count.likes,
        isLikedByUser: !!userLike,
      };
    } catch (error) {
      console.error('Error obteniendo post:', error);
      throw error;
    }
  }

  /**
   * Crear comentario en un post
   * Historia 5.4: Foro de grupo (comentarios anidados)
   */
  /*
  async createComment(postId, userId, data, token) {
    try {
      const { content, parentId } = data;

      // Obtener el post
      const post = await prisma.groupPost.findUnique({
        where: { id: postId },
      });

      if (!post || post.isDeleted) {
        throw new Error('Post no encontrado');
      }

      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: post.groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden comentar');
      }

      // Si es una respuesta, verificar que el comentario padre existe
      if (parentId) {
        const parentComment = await prisma.groupComment.findUnique({
          where: { id: parentId },
        });

        if (!parentComment || parentComment.postId !== postId) {
          throw new Error('Comentario padre no válido');
        }
      }

      // Sanitizar contenido
      const sanitizedContent = sanitizeText(content);

      // Crear el comentario
      const comment = await prisma.groupComment.create({
        data: {
          postId,
          userId,
          content: sanitizedContent,
          parentId,
        },
      });

      // Actualizar contador de comentarios del post
      await prisma.groupPost.update({
        where: { id: postId },
        data: {
          totalComments: {
            increment: 1,
          },
        },
      });

      // Notificar al autor del post (si no es el mismo usuario)
      if (post.userId !== userId) {
        await this.createNotification(
          post.userId,
          'NEW_COMMENT',
          'Nuevo comentario en tu post',
          `Alguien comentó en tu publicación`,
          { postId, commentId: comment.id, groupId: post.groupId }
        );
      }

      // Otorgar puntos XP
      await externalService.awardPoints(
        userId,
        2,
        'Comentar en post de grupo',
        token
      );

      return comment;
    } catch (error) {
      console.error('Error creando comentario:', error);
      throw error;
    }
  }

  /**
   * Obtener comentarios de un post (con anidamiento)
   * Historia 5.4: Foro de grupo
   */
  /*
  async getPostComments(postId, userId, token) {
    try {
      // Obtener el post
      const post = await prisma.groupPost.findUnique({
        where: { id: postId },
      });

      if (!post || post.isDeleted) {
        throw new Error('Post no encontrado');
      }

      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: post.groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden ver los comentarios');
      }

      // Obtener todos los comentarios
      const comments = await prisma.groupComment.findMany({
        where: {
          postId,
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Obtener perfiles de los autores
      const authorIds = [...new Set(comments.map(c => c.userId))];
      const authors = await externalService.getMultipleProfiles(authorIds, token);
      const authorMap = new Map(authors.map(a => [a.userId, a]));

      // Organizar comentarios en estructura anidada
      const commentsWithAuthors = comments.map(comment => ({
        ...comment,
        author: authorMap.get(comment.userId) || null,
        replies: [],
      }));

      // Crear mapa de comentarios por ID
      const commentsMap = new Map(commentsWithAuthors.map(c => [c.id, c]));

      // Organizar en árbol (comentarios de nivel superior y sus respuestas)
      const topLevelComments = [];

      commentsWithAuthors.forEach(comment => {
        if (comment.parentId) {
          // Es una respuesta, agregarlo al padre
          const parent = commentsMap.get(comment.parentId);
          if (parent) {
            parent.replies.push(comment);
          }
        } else {
          // Es un comentario de nivel superior
          topLevelComments.push(comment);
        }
      });

      return topLevelComments;
    } catch (error) {
      console.error('Error obteniendo comentarios:', error);
      throw error;
    }
  }

  /**
   * Dar like a un post
   */
  /*
  async likePost(postId, userId, token) {
    try {
      // Verificar que el post existe
      const post = await prisma.groupPost.findUnique({
        where: { id: postId },
      });

      if (!post || post.isDeleted) {
        throw new Error('Post no encontrado');
      }

      // Verificar que el usuario es miembro del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: post.groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('Solo los miembros pueden dar like');
      }

      // Verificar si ya dio like
      const existingLike = await prisma.groupPostLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      if (existingLike) {
        // Si ya dio like, quitarlo (toggle)
        await prisma.groupPostLike.delete({
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
        });

        // Decrementar contador
        await prisma.groupPost.update({
          where: { id: postId },
          data: {
            totalLikes: {
              decrement: 1,
            },
          },
        });

        return { liked: false };
      }

      // Crear like
      await prisma.groupPostLike.create({
        data: {
          postId,
          userId,
        },
      });

      // Incrementar contador
      await prisma.groupPost.update({
        where: { id: postId },
        data: {
          totalLikes: {
            increment: 1,
          },
        },
      });

      // Notificar al autor (si no es el mismo usuario)
      if (post.userId !== userId) {
        await this.createNotification(
          post.userId,
          'POST_LIKE',
          'Le gustó tu publicación',
          `A alguien le gustó tu publicación`,
          { postId, groupId: post.groupId }
        );
      }

      return { liked: true };
    } catch (error) {
      console.error('Error dando like al post:', error);
      throw error;
    }
  }

  /**
   * Eliminar post (solo autor o admin)
   */
  /*
  async deletePost(postId, userId) {
    try {
      const post = await prisma.groupPost.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new Error('Post no encontrado');
      }

      // Verificar permisos: autor del post o admin del grupo
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: post.groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('No tienes permiso para eliminar este post');
      }

      const canDelete = post.userId === userId || membership.role === 'ADMIN';

      if (!canDelete) {
        throw new Error('Solo el autor o el administrador pueden eliminar este post');
      }

      // Soft delete
      await prisma.groupPost.update({
        where: { id: postId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return { message: 'Post eliminado exitosamente' };
    } catch (error) {
      console.error('Error eliminando post:', error);
      throw error;
    }
  }

  /**
   * Notificar a todos los miembros del grupo (excepto el autor de la acción)
   */
  /*
  async notifyGroupMembers(groupId, excludeUserId, type, title, message, metadata = {}) {
    try {
      const members = await prisma.groupMember.findMany({
        where: {
          groupId,
          userId: { not: excludeUserId },
        },
        select: {
          userId: true,
        },
      });

      const notifications = members.map(member =>
        this.createNotification(member.userId, type, title, message, metadata)
      );

      await Promise.all(notifications);
    } catch (error) {
      console.error('Error notificando a miembros del grupo:', error);
    }
  }

  /**
   * Crear notificación
   */
  /*
  async createNotification(userId, type, title, message, metadata = {}) {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          metadata: createNotificationMetadata(type, metadata),
        },
      });
    } catch (error) {
      console.error('Error creando notificación:', error);
      return null;
    }
  }
}

module.exports = new ForumService();
*/