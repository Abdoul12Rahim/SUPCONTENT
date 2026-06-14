import { Router } from 'express';
import * as roomController from '../controllers/roomController';
import { authMiddleware } from '../middleware/authMiddleware';
import { checkRoomRole } from '../middleware/roomMiddleware';

const router = Router();

// Tout le système de salons requiert d'être authentifié
router.use(authMiddleware);

// --- ROUTES PUBLIQUES (Connecté, mais pas forcément membre) ---
router.get('/active', roomController.getActiveRooms); 
router.post('/', roomController.createRoom); // Créer un salon
router.post('/:roomId/join', roomController.joinRoom); 
router.post('/:roomId/leave', roomController.leaveRoom);

// --- ROUTES MODÉRATEURS & ADMINS ---
// Les Modérateurs et les Admins partagent ces droits de gestion de communauté
router.post('/:roomId/accept/:targetUserId', checkRoomRole(['admin', 'moderator']), roomController.acceptRequest);
router.post('/:roomId/ban/:targetUserId', checkRoomRole(['admin', 'moderator']), roomController.banUser);
router.post('/:roomId/remove/:targetUserId', checkRoomRole(['admin', 'moderator']), roomController.removeMember);
router.get('/:roomId/banned', checkRoomRole(['admin', 'moderator']), roomController.getBannedUsers);

// --- ROUTES STRICTEMENT ADMINS ---
// Seuls les Admins (et le créateur pour la suppression) peuvent modifier la structure
router.put('/:roomId', checkRoomRole(['admin']), roomController.updateRoomSettings);
router.post('/:roomId/promote/:targetUserId', checkRoomRole(['admin']), roomController.promoteMember);
router.delete('/:roomId', checkRoomRole(['admin']), roomController.deleteRoom);

export default router;