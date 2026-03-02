import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes pour les conversations
router.get('/conversations', messageController.getConversations);
router.get('/conversations/with/:userId', messageController.getOrCreateConversation);
router.delete('/conversations/:conversationId', messageController.deleteConversation);

// Routes pour les messages
router.get('/conversations/:conversationId/messages', messageController.getMessages);
router.post('/conversations/:conversationId/messages', messageController.sendMessage);
router.put('/conversations/:conversationId/read', messageController.markAsRead);
router.delete('/messages/:messageId', messageController.deleteMessage);

// Route pour le nombre de messages non lus
router.get('/unread-count', messageController.getUnreadCount);

export default router;
