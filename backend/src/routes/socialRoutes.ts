import { Router } from 'express';
import * as socialController from '../controllers/socialController';
import { authMiddleware, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

// Routes statiques en premier (avant les routes avec paramètres)
router.get('/feed', authMiddleware, socialController.getFeed);
router.get('/suggestions', authMiddleware, socialController.getUserSuggestions);
router.get('/search', optionalAuth, socialController.searchUsers);

// Routes avec paramètres ensuite
router.post('/follow/:userId', authMiddleware, socialController.followUser);
router.post('/unfollow/:userId', authMiddleware, socialController.unfollowUser);
router.get('/follow-status/:userId', optionalAuth, socialController.checkFollowStatus);
router.get('/follows-me/:userId', optionalAuth, socialController.checkIfFollowsMe);
router.get('/:userId/followers', optionalAuth, socialController.getFollowers);
router.get('/:userId/following', optionalAuth, socialController.getFollowing);

export default router;
