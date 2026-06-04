import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';
import adminController from '../controllers/adminController';

const router = express.Router();

// Toutes les routes admin nécessitent authentification + rôle admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Gestion des signalements
router.get('/reports/reviews', adminController.getReportedReviews);
router.post('/reports/reviews/:reviewId/resolve', adminController.resolveReport);

// Gestion des utilisateurs
router.post('/users/:userId/ban', adminController.banUser);
router.post('/users/:userId/unban', adminController.unbanUser);

// Gestion des reviews à la une
router.post('/reviews/:reviewId/feature', adminController.featureReview);
router.post('/reviews/:reviewId/unfeature', adminController.unfeatureReview);

export default router;
