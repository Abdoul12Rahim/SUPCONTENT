import { Router } from 'express';
import * as reviewController from '../controllers/reviewController';
import { authMiddleware, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authMiddleware, reviewController.createReview);
router.get('/recent', optionalAuth, reviewController.getRecentReviews);
router.get('/user/:userId', optionalAuth, reviewController.getReviewsByUser);
router.get('/my-review/:contentId', authMiddleware, reviewController.getUserReviewForContent);
router.get('/game/:contentId', optionalAuth, reviewController.getReviewsByGame);
router.get('/:reviewId', optionalAuth, reviewController.getReviewById);
router.post('/:reviewId/like', authMiddleware, reviewController.likeReview);
router.post('/:reviewId/comment', authMiddleware, reviewController.addComment);
router.get('/:reviewId/comments', optionalAuth, reviewController.getComments);
router.put('/comment/:commentId', authMiddleware, reviewController.updateComment);
router.delete('/comment/:commentId', authMiddleware, reviewController.deleteComment);
router.post('/:reviewId/report', authMiddleware, reviewController.reportReview);

export default router;
