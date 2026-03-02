import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import * as listController from '../controllers/listController';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// Gestion des listes
router.post('/', listController.createList);
router.get('/', listController.getUserLists);
router.get('/:listId', listController.getList);
router.put('/:listId', listController.updateList);
router.delete('/:listId', listController.deleteList);

// Gestion des items
router.post('/:listId/items', listController.addItem);
router.delete('/:listId/items/:itemId', listController.removeItem);

export default router;
