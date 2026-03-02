import { Request, Response } from 'express';
import User from '../models/User';
import socialService from '../services/socialService';
import Library from '../models/Library';
import Review from '../models/Review';
import path from 'path';
import fs from 'fs/promises';

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const [libraryCount, reviewCount, socialStats] = await Promise.all([
      Library.countDocuments({ user: userId }),
      Review.countDocuments({ user: userId }),
      socialService.getUserStats(userId),
    ]);

    res.json({ 
      libraryCount, 
      reviewCount,
      followersCount: socialStats.followers,
      followingCount: socialStats.following,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const exportUserData = async (req: Request, res: Response) => {
  try {
    const [library, reviews] = await Promise.all([
      Library.find({ user: req.user!._id }).populate('content'),
      Review.find({ user: req.user!._id }).populate('content'),
    ]);

    const data = { user: req.user, library, reviews };
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Supprimer l'ancien avatar s'il existe et n'est pas une URL externe
    if (user.avatar && !user.avatar.startsWith('http')) {
      const oldAvatarPath = path.join(process.cwd(), user.avatar);
      try {
        await fs.unlink(oldAvatarPath);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'ancien avatar:', error);
      }
    }

    // Mettre à jour l'avatar avec le nouveau chemin
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    res.json({ avatar: avatarUrl, message: 'Avatar mis à jour avec succès' });
  } catch (error: any) {
    console.error('Erreur upload avatar:', error);
    res.status(500).json({ message: error.message });
  }
};
