import { Request, Response } from 'express';
import adminService from '../services/adminService';

export const getReportedReviews = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const resolved = req.query.resolved === 'true' ? false : true; // Par défaut, montrer les signalements non résolus

    const result = await adminService.getReportedReviews(page, limit, resolved);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const resolveReport = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { deleteReview } = req.body;

    const result = await adminService.resolveReport(reviewId, deleteReview || false);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const banUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user!._id;

    const result = await adminService.banUser(userId, adminId);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const unbanUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user!._id;

    const result = await adminService.unbanUser(userId, adminId);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const featureReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;

    const result = await adminService.featureReview(reviewId);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const unfeatureReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;

    const result = await adminService.unfeatureReview(reviewId);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export default {
  getReportedReviews,
  resolveReport,
  banUser,
  unbanUser,
  featureReview,
  unfeatureReview,
};
