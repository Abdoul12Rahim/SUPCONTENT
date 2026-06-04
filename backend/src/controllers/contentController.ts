import { Request, Response } from 'express';
import contentService from '../services/contentService';
import externalApiService from '../services/externalApiService';
import axios from 'axios';

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
    

    const isNumericId = /^\d+$/.test(id);
    
    if (isNumericId) {
      const game = await contentService.getGameDetails(parseInt(id));
      res.json(game);
    } else {
     
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
export const getHeadlines = async (req: Request, res: Response) => {
  try {
    
    const apiKey = process.env.NEWS_API_KEY;
    
    const response = await axios.get(`https://newsapi.org/v2/everything?q=jeux+video&language=fr&sortBy=publishedAt&apiKey=${apiKey}`);
    res.json(response.data.articles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGamesByPlatform = async (req: Request, res: Response) => {
  try {
    const { platformId } = req.params;
    const { page = 1 } = req.query;
    // On délègue le travail au service, comme pour getNewReleases
    const result = await externalApiService.getGamesByPlatform(platformId, parseInt(page as string));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getHallOfFame = async (req: Request, res: Response) => {
  try {
    const { page = 1 } = req.query;
    // On délègue le travail au service
    const result = await externalApiService.getHallOfFame(parseInt(page as string));
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
