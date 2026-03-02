import { Request, Response } from 'express';
import socialService from '../services/socialService';
import { achievementService } from '../services/achievementService';
import { io } from '../app';

export const followUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await socialService.followUser(req.user!._id, userId);
    
    // Vérifier les achievements pour le follower
    const newAchievements = await achievementService.checkAndUnlockAchievements(req.user!._id.toString());
    if (newAchievements.length > 0) {
      newAchievements.forEach((achievement) => {
        io.to(`user_${req.user!._id}`).emit('achievement_unlocked', achievement);
      });
    }
    
    res.json({ message: 'Utilisateur suivi' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await socialService.unfollowUser(req.user!._id, userId);
    res.json({ message: 'Désabonnement réussi' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1 } = req.query;
    const result = await socialService.getFollowers(userId, parseInt(page as string));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1 } = req.query;
    const result = await socialService.getFollowing(userId, parseInt(page as string));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeed = async (req: Request, res: Response) => {
  try {
    const { page = 1 } = req.query;
    const result = await socialService.getFeed(req.user!._id, parseInt(page as string));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q, page = 1 } = req.query;
    const currentUserId = req.user?._id;
    const result = await socialService.searchUsers(
      q as string, 
      parseInt(page as string),
      20,
      currentUserId
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserSuggestions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    
    const currentUserId = req.user._id;
    const { limit = 12 } = req.query;
    
    const suggestions = await socialService.getUserSuggestions(
      currentUserId, 
      parseInt(limit as string)
    );
    res.json(suggestions);
  } catch (error: any) {
    console.error('Erreur getUserSuggestions:', error);
    res.status(500).json({ message: error.message });
  }
};

export const checkFollowStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?._id;
    
    if (!currentUserId) {
      return res.json({ isFollowing: false });
    }
    
    const isFollowing = await socialService.isFollowing(currentUserId, userId);
    res.json({ isFollowing });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const checkIfFollowsMe = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?._id;
    
    if (!currentUserId) {
      return res.json({ followsMe: false });
    }
    
    // Vérifier si userId suit currentUser
    const followsMe = await socialService.isFollowing(userId, currentUserId);
    res.json({ followsMe });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
