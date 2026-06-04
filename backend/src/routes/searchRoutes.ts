import { Router } from 'express';
import { optionalAuth } from '../middleware/authMiddleware';
import * as searchController from '../controllers/searchController';

const router = Router();

router.get('/global', optionalAuth, searchController.globalSearch);

export default router;
