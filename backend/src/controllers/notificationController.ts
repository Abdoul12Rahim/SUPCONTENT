import { Request, Response } from 'express';
import notificationService from '../services/notificationService';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { page = 1, type } = req.query;
    const result = await notificationService.getUserNotifications(
      req.user!._id, 
      parseInt(page as string),
      20,
      type as any
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    await notificationService.markAsRead(notificationId, req.user!._id);
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    await notificationService.markAllAsRead(req.user!._id);
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!._id);
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsUnread = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    await notificationService.markAsUnread(notificationId, req.user!._id);
    res.json({ message: 'Notification marquée comme non lue' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    await notificationService.deleteNotification(notificationId, req.user!._id);
    res.json({ message: 'Notification supprimée' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
