import Notification, { INotification } from '../models/Notification';
import { io } from '../app';

export class NotificationService {
  /**
   * Crée une notification
   */
  async createNotification(data: {
    user: string;
    type: 'follow' | 'like' | 'comment' | 'message' | 'recommendation';
    from: string;
    reference?: string;
    message: string;
  }): Promise<INotification> {
    const notification = await Notification.create(data);

    // Émettre dans la room utilisateur (même convention que socket.join dans app.ts)
    io.to(`user_${data.user}`).emit('new_notification', notification);

    return notification;
  }

  /**
   * Récupère les notifications d'un utilisateur
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: 'follow' | 'like' | 'comment' | 'message' | 'recommendation'
  ): Promise<{ notifications: INotification[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    // Construire le filtre
    const filter: any = { user: userId };
    if (type) {
      filter.type = type;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('from', 'username displayName avatar')
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return { 
      notifications: notifications as INotification[], 
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true }
    );
  }

  /**
   * Marque une notification comme non lue
   */
  async markAsUnread(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: false }
    );
  }

  /**
   * Marque toutes les notifications comme lues
   */
  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  }

  /**
   * Compte les notifications non lues
   */
  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ user: userId, isRead: false });
  }

  /**
   * Supprime une notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndDelete({ _id: notificationId, user: userId });
  }

  /**
   * Notification pour un nouveau follower
   */
  async notifyNewFollower(followedUserId: string, followerId: string): Promise<void> {
    await this.createNotification({
      user: followedUserId,
      type: 'follow',
      from: followerId,
      message: 'a commencé à vous suivre',
    });
  }

  /**
   * Notification pour un nouveau like sur une review
   */
  async notifyReviewLike(
    reviewAuthorId: string,
    likerId: string,
    reviewId: string
  ): Promise<void> {
    await this.createNotification({
      user: reviewAuthorId,
      type: 'like',
      from: likerId,
      reference: reviewId,
      message: 'a aimé votre critique',
    });
  }

  /**
   * Notification pour un nouveau commentaire sur une review
   */
  async notifyReviewComment(
    reviewAuthorId: string,
    commenterId: string,
    reviewId: string
  ): Promise<void> {
    await this.createNotification({
      user: reviewAuthorId,
      type: 'comment',
      from: commenterId,
      reference: reviewId,
      message: 'a commenté votre critique',
    });
  }
}

export default new NotificationService();
