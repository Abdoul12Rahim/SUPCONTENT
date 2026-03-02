import Content, { IContent } from '../models/Content';
import Review, { IReview } from '../models/Review';
import Like from '../models/Like';
import Comment from '../models/Comment';
import externalApiService from './externalApiService';

export class ContentService {
  /**
   * Récupère les détails d'un jeu avec les données locales enrichies
   */
  async getGameDetails(gameId: number): Promise<any> {
    // Récupérer ou créer le content depuis l'API externe
    const content = await externalApiService.getOrCreateContent(gameId);
    if (!content) {
      throw new Error('Jeu non trouvé');
    }

    // Compter les reviews
    const reviewCount = await Review.countDocuments({ content: content._id });

    return {
      ...content.toObject(),
      reviewCount,
    };
  }

  /**
   * Récupère les détails d'un jeu par son slug avec les données locales enrichies
   */
  async getGameBySlug(slug: string): Promise<any> {
    // Chercher dans la base de données locale
    let content = await Content.findOne({ slug });

    if (content) {
      // Vérifier si le cache est expiré (plus de 24 heures)
      const cacheAge = Date.now() - content.cachedAt.getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      if (cacheAge >= oneDayInMs) {
        // Cache expiré, récupérer depuis RAWG
        const rawgData = await externalApiService.getGameBySlug(slug);
        if (rawgData) {
          Object.assign(content, rawgData);
          await content.save();
        }
      }
    } else {
      // Pas de content local, récupérer depuis RAWG
      const rawgData = await externalApiService.getGameBySlug(slug);
      if (!rawgData) {
        throw new Error('Jeu non trouvé');
      }
      content = await Content.create(rawgData);
    }

    // Compter les reviews
    const reviewCount = await Review.countDocuments({ content: content._id });

    return {
      ...content.toObject(),
      reviewCount,
    };
  }

  /**
   * Recherche des jeux
   */
  async searchGames(
    query: string,
    page: number = 1,
    filters?: any
  ): Promise<any> {
    return externalApiService.searchGames(query, page, 20, filters);
  }

  /**
   * Récupère les jeux populaires avec données enrichies
   */
  async getPopularGames(page: number = 1): Promise<any> {
    return externalApiService.getPopularGames(page);
  }

  /**
   * Récupère les jeux par genre
   */
  async getGamesByGenre(genre: string, page: number = 1): Promise<any> {
    return externalApiService.searchGames('', page, 20, { genres: genre });
  }

  /**
   * Récupère les statistiques d'un jeu sur la plateforme
   */
  async getGameStats(contentId: string): Promise<any> {
    const reviews = await Review.find({ content: contentId });
    const totalReviews = reviews.length;
    
    let averageRating = 0;
    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      averageRating = sum / totalReviews;
    }

    return {
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(2)),
    };
  }
}

export default new ContentService();
