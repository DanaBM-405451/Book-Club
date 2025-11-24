// src/routes/friends.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend
} = require('../controllers/friends.controller');

// ✅ Aplicar middleware a TODAS las rutas de este archivo una sola vez
router.use(authMiddleware);

// Rutas (ya no necesitan 'authMiddleware' individualmente porque está arriba)

/**
 * @route POST /friends/request
 * @desc Enviar solicitud de amistad
 */
router.post('/request', sendFriendRequest);

/**
 * @route GET /friends/requests
 * @desc Obtener solicitudes de amistad recibidas
 */
router.get('/requests', getFriendRequests);

/**
 * @route POST /friends/:friendshipId/accept
 * @desc Aceptar solicitud de amistad
 */
router.post('/:friendshipId/accept', acceptFriendRequest);

/**
 * @route POST /friends/:friendshipId/reject
 * @desc Rechazar solicitud de amistad
 */
router.post('/:friendshipId/reject', rejectFriendRequest);

/**
 * @route GET /friends
 * @desc Obtener lista de amigos
 */
router.get('/', getFriends);

/**
 * @route DELETE /friends/:friendshipId
 * @desc Eliminar amistad
 */
router.delete('/:friendshipId', removeFriend);

module.exports = router;
// src/routes/friends.routes.js
/*
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend
} = require('../controllers/friends.controller');

router.use(authMiddleware);
*/
/**
 * @route POST /friends/request
 * @desc Enviar solicitud de amistad
 * @access Private
 */
//router.post('/request', authMiddleware, sendFriendRequest);

/**
 * @route GET /friends/requests
 * @desc Obtener solicitudes de amistad recibidas
 * @access Private
 */
//router.get('/requests', authMiddleware, getFriendRequests);

/**
 * @route POST /friends/:friendshipId/accept
 * @desc Aceptar solicitud de amistad
 * @access Private
 */
//router.post('/:friendshipId/accept', authMiddleware, acceptFriendRequest);
//router.post('/requests/:requestId/accept', friendsController.acceptFriendRequest);

/**
 * @route POST /friends/:friendshipId/reject
 * @desc Rechazar solicitud de amistad
 * @access Private
 */
//router.post('/:friendshipId/reject', authMiddleware, rejectFriendRequest);
//router.post('/requests/:requestId/reject', friendsController.rejectFriendRequest);


/**
 * @route GET /friends
 * @desc Obtener lista de amigos
 * @access Private
 */
//router.get('/', authMiddleware, getFriends);

/**
 * @route DELETE /friends/:friendshipId
 * @desc Eliminar amistad
 * @access Private
 */
//router.delete('/:friendshipId', authMiddleware, removeFriend);

//module.exports = router;

/*
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend
} = require('../controllers/friends.controller');

/**
 * @route POST /social/friends/request
 * @desc Enviar solicitud de amistad
 * @access Private
 */
/*
router.post('/request', authMiddleware, sendFriendRequest);

/**
 * @route GET /social/friends/requests
 * @desc Obtener solicitudes de amistad recibidas
 * @access Private
 */
//router.get('/requests', authMiddleware, getFriendRequests);

/**
 * @route PUT /social/friends/accept/:id
 * @desc Aceptar solicitud de amistad
 * @access Private
 */
//router.put('/accept/:id', authMiddleware, acceptFriendRequest);

/**
 * @route DELETE /social/friends/reject/:id
 * @desc Rechazar solicitud de amistad
 * @access Private
 */
//router.delete('/reject/:id', authMiddleware, rejectFriendRequest);

/**
 * @route GET /social/friends
 * @desc Obtener lista de amigos
 * @access Private
 */
//router.get('/', authMiddleware, getFriends);

/**
 * @route DELETE /social/friends/:id
 * @desc Eliminar amistad
 * @access Private
 */
/*
router.delete('/:id', authMiddleware, removeFriend);

module.exports = router;
*/