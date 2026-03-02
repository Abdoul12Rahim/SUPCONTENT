import { Router } from 'express';
import * as contentController from '../controllers/contentController';
import { optionalAuth } from '../middleware/authMiddleware';

const router = Router();

// Routes publiques (mais avec auth optionnelle pour personnalisation)
router.get('/search', optionalAuth, contentController.searchGames);
router.get('/popular', optionalAuth, contentController.getPopular);
router.get('/new', optionalAuth, contentController.getNewReleases);
router.get('/upcoming', optionalAuth, contentController.getUpcoming);
router.get('/genre/:genre', optionalAuth, contentController.getByGenre);
router.get('/:id', optionalAuth, contentController.getGameDetails);

export default router;
