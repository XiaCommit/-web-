const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getAvatar, uploadAvatar } = require('../controllers/avatarController');
router.use(authMiddleware);
router.get('/avatar', getAvatar);
router.post('/uploadAvatar', uploadAvatar);
module.exports = router;