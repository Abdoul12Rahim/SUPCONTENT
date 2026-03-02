import { Request, Response } from 'express';
import Library from '../models/Library';
import Content from '../models/Content';
import Activity from '../models/Activity';
import { achievementService } from '../services/achievementService';
import { io } from '../app';

export const addToLibrary = async (req: Request, res: Response) => {
  try {
    const { contentId, status, rating, hoursPlayed } = req.body;
    
    // Essayer de trouver le content par ID MongoDB ou créer depuis externalId
    let content = await Content.findById(contentId).catch(() => null);
    
    if (!content) {
      // Si pas trouvé par _id, peut-être c'est un externalId
      const externalApiService = require('../services/externalApiService').default;
      content = await externalApiService.getOrCreateContent(parseInt(contentId));
    }
    
    if (!content) {
      return res.status(404).json({ message: 'Jeu non trouvé' });
    }

    const existing = await Library.findOne({ user: req.user!._id, content: content._id });
    if (existing) {
      Object.assign(existing, { status, rating, hoursPlayed });
      await existing.save();
      return res.json(existing);
    }

    const entry = await Library.create({ 
      user: req.user!._id, 
      content: content._id, 
      status, 
      rating, 
      hoursPlayed 
    });
    
    await Activity.create({ 
      user: req.user!._id, 
      type: 'library_add', 
      content: content._id, 
      metadata: { status } 
    });
    
    // Vérifier les achievements
    const newAchievements = await achievementService.checkAndUnlockAchievements(req.user!._id.toString());
    if (newAchievements.length > 0) {
      newAchievements.forEach((achievement) => {
        io.to(`user_${req.user!._id}`).emit('achievement_unlocked', achievement);
      });
    }
    
    res.status(201).json(entry);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyLibrary = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: any = { user: req.user!._id };
    if (status) filter.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [items, total] = await Promise.all([
      Library.find(filter).populate('content').sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit as string)),
      Library.countDocuments(filter),
    ]);

    res.json({ items, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const checkInLibrary = async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    
    // Essayer de trouver le content par ID MongoDB ou externalId
    let content = await Content.findById(contentId).catch(() => null);
    
    if (!content) {
      content = await Content.findOne({ externalId: parseInt(contentId) });
    }
    
    if (!content) {
      return res.json({ inLibrary: false });
    }

    const entry = await Library.findOne({ user: req.user!._id, content: content._id });
    
    if (entry) {
      res.json({ inLibrary: true, status: entry.status, contentMongoId: content._id });
    } else {
      res.json({ inLibrary: false });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteFromLibrary = async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    
    // Essayer de trouver le content par ID MongoDB ou externalId
    let content = await Content.findById(contentId).catch(() => null);
    
    if (!content) {
      content = await Content.findOne({ externalId: parseInt(contentId) });
    }
    
    if (!content) {
      return res.status(404).json({ message: 'Contenu non trouvé' });
    }
    
    await Library.findOneAndDelete({ user: req.user!._id, content: content._id });
    res.json({ message: 'Retiré de la bibliothèque' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
