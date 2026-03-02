import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import * as collaborativeListController from '../controllers/collaborativeListController';

const router = express.Router();

// Routes publiques
router.get('/public', collaborativeListController.getPublicLists);
router.get('/:listId', authMiddleware, collaborativeListController.getList);

// Routes protégées
router.use(authMiddleware);

// Rejoindre une liste
router.get('/join/:inviteCode', collaborativeListController.joinListByCode);
router.post('/:listId/join', collaborativeListController.joinListPublic);
router.post('/:listId/regenerate-code', collaborativeListController.regenerateInviteCode);

// Gestion des listes
router.post('/', collaborativeListController.createList);
router.get('/', collaborativeListController.getUserLists);
router.put('/:listId', collaborativeListController.updateList);
router.delete('/:listId', collaborativeListController.deleteList);

// Gestion des membres
router.post('/:listId/members', collaborativeListController.addMember);
router.delete('/:listId/members/:userId', collaborativeListController.removeMember);
router.put('/:listId/members/:userId/role', collaborativeListController.updateMemberRole);

// Gestion des items
router.post('/:listId/items', collaborativeListController.addItem);
router.delete('/:listId/items/:itemId', collaborativeListController.removeItem);

export default router;
