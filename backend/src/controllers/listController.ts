import { Request, Response } from 'express';
import List from '../models/List';
import Content from '../models/Content';

// Obtenir les listes publiques (avec recherche optionnelle)
export const getPublicLists = async (req: Request, res: Response) => {
  try {
    const { q = '', page = '1', limit = '20' } = req.query;
    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));

    const query: any = { isPublic: true };
    const searchQuery = (q as string).trim();

    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    const [lists, total] = await Promise.all([
      List.find(query)
        .populate('user', 'username avatar')
        .populate('items', 'title slug backgroundImage externalId rating genres')
        .sort({ updatedAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      List.countDocuments(query),
    ]);

    res.json({
      lists,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        hasNext: pageNumber * pageSize < total,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les listes publiques d'un utilisateur
export const getUserPublicLists = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const lists = await List.find({ user: userId, isPublic: true })
      .populate('items', 'title slug backgroundImage externalId rating genres')
      .sort({ updatedAt: -1 });

    res.json({ lists });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir le détail d'une liste publique
export const getPublicListById = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;

    const list = await List.findOne({ _id: listId, isPublic: true })
      .populate('user', 'username avatar')
      .populate('items', 'title slug backgroundImage externalId rating genres');

    if (!list) {
      return res.status(404).json({ message: 'Liste publique non trouvée' });
    }

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Créer une liste personnelle
export const createList = async (req: Request, res: Response) => {
  try {
    const { name, description, isPublic } = req.body;
    const userId = req.user!._id;

    const list = await List.create({
      user: userId,
      name,
      description,
      isPublic: isPublic || false,
      items: [],
    });

    res.status(201).json(list);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Obtenir toutes les listes d'un utilisateur
export const getUserLists = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;

    const lists = await List.find({ user: userId })
      .populate('items', 'title slug backgroundImage externalId rating genres')
      .sort({ updatedAt: -1 });

    res.json({ lists });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir une liste spécifique
export const getList = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const userId = req.user!._id;

    const list = await List.findById(listId)
      .populate('items', 'title slug backgroundImage externalId rating genres');

    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (list.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une liste
export const updateList = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const { name, description, isPublic } = req.body;
    const userId = req.user!._id;

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (list.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    if (name) list.name = name;
    if (description !== undefined) list.description = description;
    if (isPublic !== undefined) list.isPublic = isPublic;

    await list.save();

    const updatedList = await List.findById(list._id)
      .populate('items', 'title slug backgroundImage externalId rating genres');

    res.json(updatedList);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer une liste
export const deleteList = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const userId = req.user!._id;

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (list.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    await list.deleteOne();
    res.json({ message: 'Liste supprimée' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Ajouter un jeu à une liste
export const addItem = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const { contentId } = req.body;
    const userId = req.user!._id;

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (list.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Trouver ou créer le content
    let content = await Content.findById(contentId).catch(() => null);
    
    if (!content) {
      // Essayer avec externalId
      if (!isNaN(parseInt(contentId))) {
        const externalApiService = require('../services/externalApiService').default;
        content = await externalApiService.getOrCreateContent(parseInt(contentId));
      }
    }

    if (!content) {
      return res.status(404).json({ message: 'Jeu non trouvé' });
    }

    // Vérifier si le jeu est déjà dans la liste
    if (list.items.some(item => item.toString() === content._id.toString())) {
      return res.status(400).json({ message: 'Le jeu est déjà dans la liste' });
    }

    list.items.push(content._id);
    await list.save();

    const updatedList = await List.findById(list._id)
      .populate('items', 'title slug backgroundImage externalId rating genres');

    res.json(updatedList);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Retirer un jeu d'une liste
export const removeItem = async (req: Request, res: Response) => {
  try {
    const { listId, itemId } = req.params;
    const userId = req.user!._id;

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'Liste non trouvée' });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (list.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Retirer le jeu de la liste
    list.items = list.items.filter(item => item.toString() !== itemId);
    await list.save();

    const updatedList = await List.findById(list._id)
      .populate('items', 'title slug backgroundImage externalId rating genres');

    res.json(updatedList);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
