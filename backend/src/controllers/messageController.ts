import { Request, Response } from 'express';
import messageService from '../services/messageService';
import notificationService from '../services/notificationService';
import { io } from '../app';

/**
 * Récupérer toutes les conversations de l'utilisateur connecté
 */
export const getConversations = async (req: Request, res: Response) => {
  try {
    const { page = 1 } = req.query;
    const result = await messageService.getUserConversations(
      req.user!._id,
      parseInt(page as string)
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Récupérer ou créer une conversation avec un utilisateur
 */
export const getOrCreateConversation = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const conversation = await messageService.getOrCreateConversation(req.user!._id, userId);
    res.json(conversation);
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

/**
 * Récupérer les messages d'une conversation
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { page = 1 } = req.query;
    const result = await messageService.getMessages(
      conversationId,
      req.user!._id,
      parseInt(page as string)
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

/**
 * Envoyer un message
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Le message ne peut pas être vide' });
    }

    const message = await messageService.sendMessage(conversationId, req.user!._id, content);

    // Récupérer la conversation pour obtenir l'autre participant
    const Conversation = require('../models/Conversation').default;
    const conversation = await Conversation.findById(conversationId).populate('participants');
    const otherParticipant = conversation.participants.find(
      (p: any) => p._id.toString() !== req.user!._id.toString()
    );

    // Envoyer une notification à l'autre participant
    if (otherParticipant) {
      await notificationService.createNotification({
        user: otherParticipant._id,
        type: 'message',
        from: req.user!._id,
        reference: conversationId,
        message: `${req.user!.displayName || req.user!.username} vous a envoyé un message`,
      });

      // Émettre un événement Socket.io pour la mise à jour en temps réel
      io.to(`user_${otherParticipant._id}`).emit('new_message', {
        conversationId,
        message,
      });
    }

    res.status(201).json(message);
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

/**
 * Marquer les messages d'une conversation comme lus
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    await messageService.markMessagesAsRead(conversationId, req.user!._id);
    res.json({ message: 'Messages marqués comme lus' });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

/**
 * Obtenir le nombre de messages non lus
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const count = await messageService.getUnreadCount(req.user!._id);
    res.json({ count });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * Supprimer une conversation
 */
export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    await messageService.deleteConversation(conversationId, req.user!._id);
    res.json({ message: 'Conversation supprimée' });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

/**
 * Supprimer un message
 */
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    
    // Récupérer le message avant de le supprimer pour notifier les participants
    const Message = require('../models/Message').default;
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }
    
    // Récupérer la conversation pour notifier les participants
    const Conversation = require('../models/Conversation').default;
    const conversation = await Conversation.findById(message.conversation).populate('participants');
    
    // Supprimer le message via le service (convertir l'ID en string)
    await messageService.deleteMessage(messageId, req.user!._id.toString());
    
    // Notifier tous les participants via Socket.io
    if (conversation) {
      conversation.participants.forEach((participant: any) => {
        io.to(`user_${participant._id}`).emit('message_deleted', {
          conversationId: message.conversation,
          messageId,
        });
      });
    }
    
    res.json({ message: 'Message supprimé' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
