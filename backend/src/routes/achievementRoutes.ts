import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getAllAchievements,
  getUserAchievements,
  getMyAchievements,
  checkAchievements,
  getMyStats,
  getUserStats,
  initializeAchievements,
} from '../controllers/achievementController';

const router = Router();

// Routes publiques
router.get('/', getAllAchievements);
router.get('/user/:userId', getUserAchievements);
router.get('/stats/:userId', getUserStats);

// Routes protégées
router.get('/my', authMiddleware, getMyAchievements);
router.get('/my/stats', authMiddleware, getMyStats);
router.post('/check', authMiddleware, checkAchievements);
router.post('/initialize', authMiddleware, initializeAchievements);

export default router;
