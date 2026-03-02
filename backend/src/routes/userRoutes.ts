import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authMiddleware, optionalAuth } from '../middleware/authMiddleware';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/username/:username', optionalAuth, userController.getUserByUsername);
router.get('/export/data', authMiddleware, userController.exportUserData);
router.get('/:userId', optionalAuth, userController.getUserProfile);
router.get('/:userId/stats', optionalAuth, userController.getUserStats);
router.post('/avatar', authMiddleware, upload.single('avatar'), userController.uploadAvatar);

export default router;
