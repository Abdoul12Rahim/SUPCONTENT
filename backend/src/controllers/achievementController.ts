import { Request, Response } from 'express';
import { achievementService } from '../services/achievementService';

// GET /api/achievements - Récupérer tous les achievements
export const getAllAchievements = async (req: Request, res: Response) => {
  try {
    const achievements = await achievementService.getAllAchievements();
    res.json(achievements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/achievements/user/:userId - Récupérer les achievements d'un utilisateur
export const getUserAchievements = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const achievements = await achievementService.getUserAchievements(userId);
    res.json(achievements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/achievements/my - Récupérer mes achievements
export const getMyAchievements = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const achievements = await achievementService.getUserAchievements(userId);
    res.json(achievements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/achievements/check - Vérifier et débloquer les achievements
export const checkAchievements = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const newlyUnlocked = await achievementService.checkAndUnlockAchievements(userId);
    
    res.json({
      message: 'Achievements vérifiés',
      newlyUnlocked,
      count: newlyUnlocked.length,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/achievements/stats - Récupérer les statistiques d'achievements
export const getMyStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const stats = await achievementService.getUserStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/achievements/stats/:userId - Récupérer les stats d'un utilisateur
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const stats = await achievementService.getUserStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/achievements/initialize - Initialiser les achievements par défaut (admin)
export const initializeAchievements = async (req: Request, res: Response) => {
  try {
    await achievementService.initializeDefaultAchievements();
    res.json({ message: 'Achievements initialisés avec succès' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
