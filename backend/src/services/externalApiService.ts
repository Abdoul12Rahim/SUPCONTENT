import axios, { AxiosInstance } from 'axios';
import NodeCache from 'node-cache';
import { API_CONFIG } from '../config/api';
import Content, { IContent } from '../models/Content';

interface RAWGGame {
  id: number;
  slug: string;
  name: string;
  description_raw?: string;
  released?: string;
  background_image?: string;
  metacritic?: number;
  rating?: number;
  ratings_count?: number;
  playtime?: number;
  genres?: Array<{ name: string }>;
  platforms?: Array<{ platform: { name: string } }>;
  developers?: Array<{ name: string }>;
  publishers?: Array<{ name: string }>;
  esrb_rating?: { name: string };
  website?: string;
}

interface RAWGResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export class ExternalApiService {
  private axiosInstance: AxiosInstance;
  private cache: NodeCache;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.RAWG.BASE_URL,
      params: {
        key: API_CONFIG.RAWG.API_KEY,
      },
      timeout: 10000,
    });

    // Cache avec TTL de 1 heure par défaut
    this.cache = new NodeCache({ stdTTL: API_CONFIG.CACHE.TTL });
  }

  /**
   * Transforme les données RAWG en format Content
   */
  private transformRAWGGame(rawgGame: RAWGGame): Partial<IContent> {
    return {
      externalId: rawgGame.id,
      slug: rawgGame.slug,
      title: rawgGame.name,
      description: rawgGame.description_raw || '',
      released: rawgGame.released,
      backgroundImage: rawgGame.background_image,
      metacritic: rawgGame.metacritic,
      rating: rawgGame.rating,
      ratingsCount: rawgGame.ratings_count,
      playtime: rawgGame.playtime,
      genres: rawgGame.genres?.map((g) => g.name) || [],
      platforms: rawgGame.platforms?.map((p) => p.platform.name) || [],
      developers: rawgGame.developers?.map((d) => d.name) || [],
      publishers: rawgGame.publishers?.map((p) => p.name) || [],
      esrbRating: rawgGame.esrb_rating?.name,
      website: rawgGame.website,
      cachedAt: new Date(),
    };
  }

  /**
   * Recherche des jeux par terme de recherche
   */
  async searchGames(
    query: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      genres?: string;
      platforms?: string;
      dates?: string;
      ordering?: string;
    }
  ): Promise<{ results: Partial<IContent>[]; count: number; next: string | null }> {
    const cacheKey = `search_${query}_${page}_${JSON.stringify(filters)}`;
    const cached = this.cache.get<RAWGResponse<RAWGGame>>(cacheKey);

    if (cached) {
      return {
        results: cached.results.map((game: any) => this.transformRAWGGame(game)),
        count: cached.count,
        next: cached.next,
      };
    }

    try {
      const params: any = {
        search: query,
        page,
        page_size: pageSize,
        ...filters,
      };

      const response = await this.axiosInstance.get<RAWGResponse<RAWGGame>>('/games', {
        params,
      });

      // Mettre en cache la réponse
      this.cache.set(cacheKey, response.data);

      return {
        results: response.data.results.map((game: RAWGGame) => this.transformRAWGGame(game)),
        count: response.data.count,
        next: response.data.next,
      };
    } catch (error) {
      console.error('Erreur lors de la recherche de jeux:', error);
      throw new Error('Erreur lors de la recherche de jeux');
    }
  }

  /**
   * Récupère les détails d'un jeu par son ID RAWG
   */
  async getGameById(gameId: number): Promise<Partial<IContent> | null> {
    const cacheKey = `game_${gameId}`;
    const cached = this.cache.get<RAWGGame>(cacheKey);

    if (cached) {
      return this.transformRAWGGame(cached);
    }

    try {
      const response = await this.axiosInstance.get<RAWGGame>(`/games/${gameId}`);

      // Mettre en cache la réponse
      this.cache.set(cacheKey, response.data);

      return this.transformRAWGGame(response.data);
    } catch (error) {
      console.error(`Erreur lors de la récupération du jeu ${gameId}:`, error);
      return null;
    }
  }

  /**
   * Récupère les détails d'un jeu par son slug
   */
  async getGameBySlug(slug: string): Promise<Partial<IContent> | null> {
    const cacheKey = `game_slug_${slug}`;
    const cached = this.cache.get<RAWGGame>(cacheKey);

    if (cached) {
      return this.transformRAWGGame(cached);
    }

    try {
      const response = await this.axiosInstance.get<RAWGGame>(`/games/${slug}`);

      // Mettre en cache la réponse
      this.cache.set(cacheKey, response.data);

      return this.transformRAWGGame(response.data);
    } catch (error) {
      console.error(`Erreur lors de la récupération du jeu ${slug}:`, error);
      return null;
    }
  }

  /**
   * Récupère ou crée un Content depuis RAWG
   */
  async getOrCreateContent(gameId: number): Promise<IContent | null> {
    // Chercher dans la base de données locale
    let content = await Content.findOne({ externalId: gameId });

    if (content) {
      // Vérifier si le cache est expiré (plus de 24 heures)
      const cacheAge = Date.now() - content.cachedAt.getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      if (cacheAge < oneDayInMs) {
        return content;
      }
    }

    // Récupérer depuis RAWG
    const rawgData = await this.getGameById(gameId);
    if (!rawgData) {
      return null;
    }

    // Mettre à jour ou créer le content
    if (content) {
      Object.assign(content, rawgData);
      await content.save();
    } else {
      content = await Content.create(rawgData);
    }

    return content;
  }

  /**
   * Récupère les jeux populaires
   */
  async getPopularGames(page: number = 1, pageSize: number = 20): Promise<any> {
    return this.searchGames('', page, pageSize, {
      ordering: '-rating',
    });
  }

  /**
   * Récupère les nouveaux jeux
   */
  async getNewGames(page: number = 1, pageSize: number = 20): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const dates = `${oneMonthAgo.toISOString().split('T')[0]},${today}`;

    return this.searchGames('', page, pageSize, {
      dates,
      ordering: '-released',
    });
  }

  /**
   * Récupère les jeux à venir
   */
  async getUpcomingGames(page: number = 1, pageSize: number = 20): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    const dates = `${today},${sixMonthsLater.toISOString().split('T')[0]}`;

    return this.searchGames('', page, pageSize, {
      dates,
      ordering: 'released',
    });
  }
  /**
   * Récupère les jeux par plateforme (PC, PS, Xbox, Switch)
   */
  async getGamesByPlatform(platformId: string, page: number = 1, pageSize: number = 20): Promise<any> {
    return this.searchGames('', page, pageSize, {
      platforms: platformId,
      ordering: '-added',
    });
  }

  /**
   * Récupère le Hall of Fame 2026
   */
  async getHallOfFame(page: number = 1, pageSize: number = 20): Promise<any> {
    return this.searchGames('', page, pageSize, {
      dates: '2025-01-01,2026-12-31',
      ordering: '-rating',
    });
  }
}

export default new ExternalApiService();
