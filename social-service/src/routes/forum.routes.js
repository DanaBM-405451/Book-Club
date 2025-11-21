// src/routes/forum.routes.js

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  createPost,
  getGroupPosts,
  getPostById,
  createComment,
  getPostComments,
  deletePost,
  deleteComment
} = require('../controllers/forum.controller');

/**
 * @route POST /groups/:groupId/posts
 * @desc Crear publicación en el foro del grupo
 * @access Private (solo miembros)
 */
router.post('/:groupId/posts', authMiddleware, createPost);

/**
 * @route GET /groups/:groupId/posts
 * @desc Obtener publicaciones del grupo
 * @access Private (solo miembros)
 */
router.get('/:groupId/posts', authMiddleware, getGroupPosts);

/**
 * @route GET /groups/:groupId/posts/:postId
 * @desc Obtener detalle de un post
 * @access Private (solo miembros)
 */
router.get('/:groupId/posts/:postId', authMiddleware, getPostById);

/**
 * @route DELETE /groups/:groupId/posts/:postId
 * @desc Eliminar post
 * @access Private (autor o admin)
 */
router.delete('/:groupId/posts/:postId', authMiddleware, deletePost);

/**
 * @route POST /groups/:groupId/posts/:postId/comments
 * @desc Crear comentario en una publicación
 * @access Private (solo miembros)
 */
router.post('/:groupId/posts/:postId/comments', authMiddleware, createComment);

/**
 * @route GET /groups/:groupId/posts/:postId/comments
 * @desc Obtener comentarios de una publicación
 * @access Private (solo miembros)
 */
router.get('/:groupId/posts/:postId/comments', authMiddleware, getPostComments);

/**
 * @route DELETE /groups/:groupId/posts/:postId/comments/:commentId
 * @desc Eliminar comentario
 * @access Private (autor o admin)
 */
router.delete('/:groupId/posts/:postId/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;

/*
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  createPost,
  getGroupPosts,
  createComment,
  getPostComments
} = require('../controllers/forum.controller');

/**
 * @route POST /social/groups/:id/posts
 * @desc Crear publicación en el foro del grupo
 * @access Private (solo miembros)
 */
//router.post('/:id/posts', authMiddleware, createPost);

/**
 * @route GET /social/groups/:id/posts
 * @desc Obtener publicaciones del grupo
 * @access Private (solo miembros)
 */
//router.get('/:id/posts', authMiddleware, getGroupPosts);

/**
 * @route POST /social/groups/:id/posts/:postId/comments
 * @desc Crear comentario en una publicación
 * @access Private (solo miembros)
 */
//router.post('/:id/posts/:postId/comments', authMiddleware, createComment);

/**
 * @route GET /social/groups/:id/posts/:postId/comments
 * @desc Obtener comentarios de una publicación
 * @access Private (solo miembros)
 */
/*
router.get('/:id/posts/:postId/comments', authMiddleware, getPostComments);

module.exports = router;
*/

/*
social-service/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   └── groupMember.middleware.js
│   ├── routes/
│   │   ├── users.routes.js
│   │   ├── friends.routes.js
│   │   ├── groups.routes.js
│   │   ├── forum.routes.js
│   │   ├── goals.routes.js
│   │   ├── proposals.routes.js
│   │   └── challenges.routes.js
│   ├── controllers/
│   │   ├── users.controller.js
│   │   ├── friends.controller.js
│   │   ├── groups.controller.js
│   │   ├── forum.controller.js
│   │   ├── goals.controller.js
│   │   ├── proposals.controller.js
│   │   └── challenges.controller.js
│   ├── services/
│   │   ├── users.service.js
│   │   ├── friends.service.js
│   │   ├── groups.service.js
│   │   ├── forum.service.js
│   │   ├── goals.service.js
│   │   ├── proposals.service.js
│   │   ├── challenges.service.js
│   │   └── external.service.js
│   ├── utils/
│   │   ├── validators.js
│   │   └── helpers.js
│   └── app.js
├── .env
├── Dockerfile
└── package.json
*/