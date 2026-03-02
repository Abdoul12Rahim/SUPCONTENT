import { Router } from 'express';
import * as libraryController from '../controllers/libraryController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authMiddleware, libraryController.addToLibrary);
router.get('/my', authMiddleware, libraryController.getMyLibrary);
router.get('/check/:contentId', authMiddleware, libraryController.checkInLibrary);
router.delete('/:contentId', authMiddleware, libraryController.deleteFromLibrary);

export default router;
