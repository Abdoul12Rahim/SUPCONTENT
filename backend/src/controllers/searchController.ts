import { Request, Response } from 'express';
import contentService from '../services/contentService';
import User from '../models/User';
import List from '../models/List';
import CollaborativeList from '../models/CollaborativeList';

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const { q = '', page = '1', limit = '10' } = req.query;
    const query = (q as string).trim();

    if (!query) {
      return res.status(400).json({ message: 'Le paramètre q est requis' });
    }

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(25, Math.max(1, parseInt(limit as string, 10) || 10));

    const [gamesResult, users, publicLists, collaborativeLists] = await Promise.all([
      contentService.searchGames(query, pageNumber),
      User.find({
        isBanned: false,
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { displayName: { $regex: query, $options: 'i' } },
        ],
      })
        .select('username displayName avatar bio')
        .limit(pageSize),
      List.find({
        isPublic: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      })
        .populate('user', 'username avatar')
        .select('name description isPublic items user updatedAt')
        .sort({ updatedAt: -1 })
        .limit(pageSize),
      CollaborativeList.find({
        visibility: 'public',
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } },
        ],
      })
        .populate('owner', 'username avatar')
        .select('name description visibility tags owner updatedAt members items')
        .sort({ updatedAt: -1 })
        .limit(pageSize),
    ]);

    res.json({
      query,
      page: pageNumber,
      games: {
        results: gamesResult.results,
        count: gamesResult.count,
        hasNext: Boolean(gamesResult.next),
      },
      users,
      lists: {
        personal: publicLists,
        collaborative: collaborativeLists,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
