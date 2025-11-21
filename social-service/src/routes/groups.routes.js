
// src/routes/groups.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  createGroup,
  getPublicGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  getMyGroups,
  updateGroup,
  grantUploadPermission,
  revokeUploadPermission
} = require('../controllers/groups.controller');

/**
 * @route POST /groups
 * @desc Crear un nuevo grupo de lectura
 * @access Private
 */
router.post('/', authMiddleware, createGroup);

/**
 * @route GET /groups
 * @desc Listar grupos públicos
 * @access Private
 */
router.get('/', authMiddleware, getPublicGroups);

/**
 * @route GET /groups/my-groups
 * @desc Obtener grupos del usuario
 * @access Private
 */
router.get('/my-groups', authMiddleware, getMyGroups);

/**
 * @route GET /groups/:groupId
 * @desc Obtener detalles de un grupo
 * @access Private
 */
router.get('/:groupId', authMiddleware, getGroupById);

/**
 * @route PUT /groups/:groupId
 * @desc Actualizar grupo (solo admin)
 * @access Private
 */
router.put('/:groupId', authMiddleware, updateGroup);

/**
 * @route POST /groups/:groupId/join
 * @desc Unirse a un grupo
 * @access Private
 */
router.post('/:groupId/join', authMiddleware, joinGroup);

/**
 * @route DELETE /groups/:groupId/leave
 * @desc Salir de un grupo
 * @access Private
 */
router.delete('/:groupId/leave', authMiddleware, leaveGroup);

/**
 * @route POST /groups/:groupId/members/:userId/grant-upload
 * @desc Dar permiso para subir libros (solo admin)
 * @access Private
 */
router.post('/:groupId/members/:userId/grant-upload', authMiddleware, grantUploadPermission);

/**
 * @route POST /groups/:groupId/members/:userId/revoke-upload
 * @desc Revocar permiso para subir libros (solo admin)
 * @access Private
 */
router.post('/:groupId/members/:userId/revoke-upload', authMiddleware, revokeUploadPermission);

module.exports = router;

/*
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  createGroup,
  getPublicGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  getMyGroups
} = require('../controllers/group.controller');

/**
 * @route POST /social/groups
 * @desc Crear un nuevo grupo de lectura
 * @access Private
 */
//router.post('/', authMiddleware, createGroup);

/**
 * @route GET /social/groups
 * @desc Listar grupos públicos
 * @access Private
 */
//router.get('/', authMiddleware, getPublicGroups);

/**
 * @route GET /social/groups/my-groups
 * @desc Obtener grupos del usuario
 * @access Private
 */
//router.get('/my-groups', authMiddleware, getMyGroups);

/**
 * @route GET /social/groups/:id
 * @desc Obtener detalles de un grupo
 * @access Private
 */
//router.get('/:id', authMiddleware, getGroupById);

/**
 * @route POST /social/groups/:id/join
 * @desc Unirse a un grupo
 * @access Private
 */
//router.post('/:id/join', authMiddleware, joinGroup);

/**
 * @route DELETE /social/groups/:id/leave
 * @desc Salir de un grupo
 * @access Private
 */
/*
router.delete('/:id/leave', authMiddleware, leaveGroup);

module.exports = router;
*/