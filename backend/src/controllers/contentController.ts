import { Request, Response } from 'express';
import contentService from '../services/contentService';
import externalApiService from '../services/externalApiService';

export const searchGames = async (req: Request, res: Response) => {
  try {
    const { q, page = 1, genres, platforms, ordering } = req.query;
    const result = await contentService.searchGames(
      q as string,
      parseInt(page as string),
      { genres, platforms, ordering }
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGameDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Détecter si c'est un ID numérique ou un slug
    const isNumericId = /^\d+$/.test(id);
    
    if (isNumericId) {
      const game = await contentService.getGameDetails(parseInt(id));
      res.json(game);
    } else {
      // Si c'est un slug, récupérer par slug
      const game = await contentService.getGameBySlug(id);
      res.json(game);
    }
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getPopular = async (req: Request, res: Response) => {
  try {
    const { page = 1 } = req.query;
    const result = await contentService.getPopularGames(parseInt(page as string));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getNewReleases = async (req: Request, res: Response) => {
  try {
    const { page = 1 } = req.query;
    const result = await externalApiService.getNewGames(parseInt(page as string));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUpcoming = async (req: Request, res: Response) => {
  try {
    const { page = 1 } = req.query;
    const result = await externalApiService.getUpcomingGames(parseInt(page as string));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getByGenre = async (req: Request, res: Response) => {
  try {
    const { genre } = req.params;
    const { page = 1 } = req.query;
    const result = await contentService.getGamesByGenre(genre, parseInt(page as string));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
