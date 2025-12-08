
// src/routes/groups.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware} = require('../middleware/auth.middleware');
const groupsController = require('../controllers/groups.controller');
const forumController = require('../controllers/forum.controller');
const goalsController = require('../controllers/goals.controller');
const proposalsController = require('../controllers/proposals.controller');
const challengesController = require('../controllers/challenges.controller');

router.get('/admin/stats', authMiddleware, groupsController.getAdminStats);
// ========== GRUPOS ==========
router.post('/', authMiddleware, groupsController.createGroup);
router.get('/', authMiddleware, groupsController.getPublicGroups);
router.get('/my-groups', authMiddleware, groupsController.getMyGroups);
router.get('/:groupId', authMiddleware, groupsController.getGroupById);
router.put('/:groupId', authMiddleware, groupsController.updateGroup);
router.post('/:groupId/join', authMiddleware, groupsController.joinGroup);
router.post('/:groupId/leave', authMiddleware, groupsController.leaveGroup);

// ========== MIEMBROS ==========
router.get('/:groupId/members', authMiddleware, groupsController.getGroupMembers);
router.put('/:groupId/members/:userId/role', authMiddleware, groupsController.updateMemberRole);
router.put('/:groupId/members/:userId/permissions', authMiddleware, groupsController.updateMemberPermissions);
router.delete('/:groupId/members/:userId', authMiddleware, groupsController.removeMember);

// ========== FORO ==========
router.get('/:groupId/posts', authMiddleware, forumController.getGroupPosts);
router.post('/:groupId/posts', authMiddleware, forumController.createPost);
router.delete('/:groupId/posts/:postId', authMiddleware, forumController.deletePost);
router.get('/:groupId/posts/:postId/comments', authMiddleware, forumController.getPostComments);
router.post('/:groupId/posts/:postId/comments', authMiddleware, forumController.createComment);

// ========== PROPUESTAS ==========
router.get('/:groupId/proposals', authMiddleware, proposalsController.getProposals);
router.post('/:groupId/proposals', authMiddleware, proposalsController.createProposal);
router.post('/:groupId/proposals/:proposalId/vote', authMiddleware, proposalsController.voteProposal);
router.post('/:groupId/proposals/:proposalId/close', authMiddleware, proposalsController.closeProposal);
router.delete('/:groupId/proposals/:proposalId', authMiddleware, proposalsController.cancelProposal);
router.get('/:groupId/proposals/winner', authMiddleware, proposalsController.getWinner);

// ========== METAS ==========
router.get('/:groupId/goals', authMiddleware, goalsController.getGoals);
router.post('/:groupId/goals', authMiddleware, goalsController.createGoal);
router.get('/:groupId/goals/active', authMiddleware, goalsController.getActiveGoal);
router.put('/:groupId/goals/:goalId', authMiddleware, goalsController.updateGoal);
router.delete('/:groupId/goals/:goalId', authMiddleware, goalsController.deleteGoal);
router.post('/:groupId/goals/:goalId/complete', authMiddleware, goalsController.completeGoal);

// ========== RETOS ==========
router.get('/:groupId/challenges', authMiddleware, challengesController.getChallenges);
router.post('/:groupId/challenges', authMiddleware, challengesController.createChallenge);
router.get('/:groupId/challenges/active', authMiddleware, challengesController.getActiveChallenge);
router.post('/:groupId/challenges/:challengeId/join', authMiddleware, challengesController.joinChallenge);
router.post('/:groupId/challenges/:challengeId/progress', authMiddleware, challengesController.updateChallengeProgress);
router.get('/:groupId/challenges/:challengeId/ranking', authMiddleware, challengesController.getChallengeRanking);
router.post('/:groupId/challenges/:challengeId/archive', authMiddleware, challengesController.archiveChallenge);
router.post('/:groupId/challenges/:challengeId/reactivate', authMiddleware, challengesController.reactivateChallenge);

module.exports = router;

/*const express = require('express');
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
//router.post('/', authMiddleware, createGroup);

/**
 * @route GET /groups
 * @desc Listar grupos públicos
 * @access Private
 */
//router.get('/', authMiddleware, getPublicGroups);

/**
 * @route GET /groups/my-groups
 * @desc Obtener grupos del usuario
 * @access Private
 */
//router.get('/my-groups', authMiddleware, getMyGroups);

/**
 * @route GET /groups/:groupId
 * @desc Obtener detalles de un grupo
 * @access Private
 */
//router.get('/:groupId', authMiddleware, getGroupById);

/**
 * @route PUT /groups/:groupId
 * @desc Actualizar grupo (solo admin)
 * @access Private
 */
//router.put('/:groupId', authMiddleware, updateGroup);

/**
 * @route POST /groups/:groupId/join
 * @desc Unirse a un grupo
 * @access Private
 */
//router.post('/:groupId/join', authMiddleware, joinGroup);

/**
 * @route DELETE /groups/:groupId/leave
 * @desc Salir de un grupo
 * @access Private
 */
//router.delete('/:groupId/leave', authMiddleware, leaveGroup);

/**
 * @route POST /groups/:groupId/members/:userId/grant-upload
 * @desc Dar permiso para subir libros (solo admin)
 * @access Private
 */
//router.post('/:groupId/members/:userId/grant-upload', authMiddleware, grantUploadPermission);

/**
 * @route POST /groups/:groupId/members/:userId/revoke-upload
 * @desc Revocar permiso para subir libros (solo admin)
 * @access Private
 */
//router.post('/:groupId/members/:userId/revoke-upload', authMiddleware, revokeUploadPermission);

//module.exports = router;

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