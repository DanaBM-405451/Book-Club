// src/routes/users.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { 
  searchUsers, 
  getUserPublicProfile 
} = require('../controllers/users.controller');

/**
 * @route GET /users/search
 * @desc Buscar usuarios por username
 * @access Private
 */
router.get('/search', authMiddleware, searchUsers);

/**
 * @route GET /users/:userId
 * @desc Obtener perfil público de un usuario
 * @access Private
 */
router.get('/:userId', authMiddleware, getUserPublicProfile);

module.exports = router;
/*
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { 
  searchUsersByUsername, 
  getUserPublicProfile 
} = require('../controllers/user.controller');

/**
 * @route GET /social/users/search
 * @desc Buscar usuarios por username
 * @access Private
 */
//router.get('/search', authMiddleware, searchUsersByUsername);

/**
 * @route GET /social/users/:id
 * @desc Obtener perfil público de un usuario
 * @access Private
 */
/*
router.get('/:id', authMiddleware, getUserPublicProfile);

module.exports = router;
*/
