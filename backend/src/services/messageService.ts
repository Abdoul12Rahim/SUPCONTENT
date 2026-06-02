import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
import Follow from '../models/Follow';
import HttpError from '../utils/httpError';
import mongoose from 'mongoose';

export class MessageService {
  /**
   * Récupérer ou créer une conversation entre 2 utilisateurs
   */
  async getOrCreateConversation(userId1: string, userId2: string): Promise<any> {
    // Vérifier que les deux utilisateurs existent
    const [user1, user2] = await Promise.all([
      User.findById(userId1),
      User.findById(userId2),
    ]);

    if (!user1 || !user2) {
      throw new HttpError(404, 'Utilisateur non trouvé');
    }

    if (userId1 === userId2) {
      throw new HttpError(400, 'Impossible de créer une conversation avec soi-même');
    }

    // Chercher une conversation existante (ordre des participants n'importe pas)
    let conversation = await Conversation.findOne({
      participants: { $all: [userId1, userId2] },
    })
      .populate('participants', 'username displayName avatar')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username displayName' },
      });

    // Si la conversation n'existe pas, la créer
    if (!conversation) {
      // Vérifier la règle de follow mutuel avant création
      const follows = await Promise.all([
        Follow.findOne({ follower: userId1, following: userId2 }),
        Follow.findOne({ follower: userId2, following: userId1 }),
      ]);

      if (!follows[0] || !follows[1]) {
        throw new HttpError(403, 'Conversation autorisée uniquement entre utilisateurs se suivant mutuellement');
      }

      conversation = await Conversation.create({ participants: [userId1, userId2] });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'username displayName avatar')
        .lean();
    }

    // Si la conversation existe, vérifier toujours la relation mutuelle
    else {
      const follows = await Promise.all([
        Follow.findOne({ follower: userId1, following: userId2 }),
        Follow.findOne({ follower: userId2, following: userId1 }),
      ]);

      if (!follows[0] || !follows[1]) {
        throw new HttpError(403, 'Conversation non disponible — follow mutuel requis');
      }
    }

    return conversation;
  }

  /**
   * Récupérer toutes les conversations d'un utilisateur
   */
  async getUserConversations(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      Conversation.find({ participants: userId })
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('participants', 'username displayName avatar')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'username displayName' },
        })
        .lean(),
      Conversation.countDocuments({ participants: userId }),
    ]);

    // Ajouter le nombre de messages non lus pour chaque conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv: any) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          read: false,
        });

        // Trouver l'autre participant
        const otherParticipant = conv.participants.find(
          (p: any) => p._id.toString() !== userId
        );

        return {
          ...conv,
          unreadCount,
          otherParticipant,
        };
      })
    );

    return {
      conversations: conversationsWithUnread,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Envoyer un message
   */
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<any> {
    // Vérifier que la conversation existe et que l'utilisateur en fait partie
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
    });

    if (!conversation) {
      throw new Error('Conversation non trouvée ou accès non autorisé');
    }

    // Créer le message
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content,
      read: false,
    });

    // Mettre à jour la conversation
    conversation.lastMessage = message._id as any;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populer le message avant de le retourner
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username displayName avatar')
      .lean();

    return populatedMessage;
  }

  /**
   * Récupérer les messages d'une conversation
   */
  async getMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<any> {
    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      throw new Error('Conversation non trouvée ou accès non autorisé');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username displayName avatar')
        .lean(),
      Message.countDocuments({ conversation: conversationId }),
    ]);

    return {
      messages: messages.reverse(), // Inverser pour avoir l'ordre chronologique
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Marquer les messages comme lus
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        read: false,
      },
      { read: true }
    );
  }

  /**
   * Toggle like for a message by a user (like/unlike)
   */
  async toggleLike(messageId: string, userId: string): Promise<{ action: 'like' | 'unlike'; message: any }> {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error('Message non trouvé');
    }

    // Vérifier que l'utilisateur appartient bien à la conversation
    const conversation = await Conversation.findOne({ _id: message.conversation, participants: userId });
    if (!conversation) {
      throw new Error('Accès non autorisé');
    }

    const alreadyLiked = message.likedBy && message.likedBy.some((l: any) => l.user.toString() === userId.toString());

    let action: 'like' | 'unlike' = 'like';

    if (alreadyLiked) {
      // Retirer le like
      await Message.updateOne({ _id: messageId }, { $pull: { likedBy: { user: userId } } });
      action = 'unlike';
    } else {
      // Ajouter le like
      await Message.updateOne({ _id: messageId }, { $push: { likedBy: { user: userId, likedAt: new Date() } } });
      action = 'like';
    }

    const populated = await Message.findById(messageId).populate('sender', 'username displayName avatar').lean();

    return { action, message: populated };
  }

  /**
   * Obtenir le nombre total de messages non lus
   */
  async getUnreadCount(userId: string): Promise<number> {
    // Récupérer toutes les conversations de l'utilisateur
    const conversations = await Conversation.find({ participants: userId }).select('_id');
    const conversationIds = conversations.map((c) => c._id);

    // Compter les messages non lus
    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: userId },
      read: false,
    });

    return unreadCount;
  }

  /**
   * Supprimer une conversation (pour un utilisateur)
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      throw new Error('Conversation non trouvée');
    }

    // Supprimer tous les messages de la conversation
    await Message.deleteMany({ conversation: conversationId });

    // Supprimer la conversation
    await conversation.deleteOne();
  }

  /**
   * Supprimer un message
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error('Message non trouvé');
    }

    // Vérifier que l'utilisateur est l'expéditeur du message
    // Convertir les deux en string pour une comparaison fiable
    const messageSenderId = message.sender.toString();
    const requestUserId = userId.toString();
    
    if (messageSenderId !== requestUserId) {
      throw new Error('Vous ne pouvez supprimer que vos propres messages');
    }

    // Vérifier si ce message est le dernier message de la conversation
    const conversation = await Conversation.findById(message.conversation);
    if (conversation && conversation.lastMessage?.toString() === messageId) {
      // Trouver le message précédent
      const previousMessage = await Message.findOne({
        conversation: message.conversation,
        _id: { $ne: messageId },
      }).sort({ createdAt: -1 });

      if (previousMessage) {
        conversation.lastMessage = previousMessage._id as any;
        conversation.lastMessageAt = previousMessage.createdAt;
      } else {
        conversation.lastMessage = undefined;
        conversation.lastMessageAt = undefined;
      }
      await conversation.save();
    }

    // Supprimer le message
    await message.deleteOne();
  }
}

export default new MessageService();
