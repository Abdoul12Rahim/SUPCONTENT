import { Achievement, IAchievement } from '../models/Achievement';
import { UserAchievement } from '../models/UserAchievement';
import Library from '../models/Library';
import Review from '../models/Review';
import Follow from '../models/Follow';
import Like from '../models/Like';
import Comment from '../models/Comment';
import mongoose from 'mongoose';

class AchievementService {
  // Récupérer tous les achievements
  async getAllAchievements() {
    return await Achievement.find().sort({ category: 1, points: 1 });
  }

  // Récupérer les achievements d'un utilisateur avec progression
  async getUserAchievements(userId: string) {
    const achievements = await Achievement.find();
    const userAchievements = await UserAchievement.find({ user: userId }).populate('achievement');

    // Créer une map des progrès utilisateur
    const progressMap = new Map();
    userAchievements.forEach((ua) => {
      progressMap.set(ua.achievement._id.toString(), {
        progress: ua.progress,
        isUnlocked: ua.isUnlocked,
        unlockedAt: ua.unlockedAt,
      });
    });

    // Combiner les achievements avec les progrès
    const result = achievements.map((achievement) => {
      const userProgress = progressMap.get(achievement._id.toString());
      return {
        achievement,
        progress: userProgress?.progress || 0,
        isUnlocked: userProgress?.isUnlocked || false,
        unlockedAt: userProgress?.unlockedAt,
      };
    });

    return result;
  }

  // Calculer la progression actuelle pour un achievement
  private async calculateProgress(userId: string, achievement: IAchievement): Promise<number> {
    const { condition } = achievement;

    switch (condition.target) {
      case 'games':
        // Nombre de jeux dans la bibliothèque
        return await Library.countDocuments({ user: userId });

      case 'reviews':
        // Nombre de critiques écrites
        return await Review.countDocuments({ user: userId });

      case 'reviews_long':
        // Nombre de critiques longues (>500 caractères)
        return await Review.countDocuments({
          user: userId,
          $expr: { $gte: [{ $strLenCP: '$text' }, 500] },
        });

      case 'followers':
        // Nombre de followers
        return await Follow.countDocuments({ following: userId });

      case 'following':
        // Nombre de personnes suivies
        return await Follow.countDocuments({ follower: userId });

      case 'likes_received':
        // Nombre de likes reçus sur les reviews
        const userReviews = await Review.find({ user: userId }).select('_id');
        const reviewIds = userReviews.map((r: any) => r._id);
        return await Like.countDocuments({ review: { $in: reviewIds } });

      case 'comments':
        // Nombre de commentaires postés
        return await Comment.countDocuments({ user: userId });

      case 'rating_5':
        // A noté au moins un jeu 5 étoiles
        const fiveStarReview = await Review.findOne({ user: userId, rating: 5 });
        return fiveStarReview ? 1 : 0;

      case 'rating_1':
        // A noté au moins un jeu 1 étoile
        const oneStarReview = await Review.findOne({ user: userId, rating: 1 });
        return oneStarReview ? 1 : 0;

      default:
        return 0;
    }
  }

  // Vérifier et débloquer les achievements pour un utilisateur
  async checkAndUnlockAchievements(userId: string): Promise<IAchievement[]> {
    const achievements = await Achievement.find();
    const unlockedAchievements: IAchievement[] = [];

    for (const achievement of achievements) {
      // Vérifier si déjà débloqué
      const existing = await UserAchievement.findOne({
        user: userId,
        achievement: achievement._id,
        isUnlocked: true,
      });

      if (existing) continue;

      // Calculer la progression
      const progress = await this.calculateProgress(userId, achievement);
      const isComplete = progress >= achievement.condition.value;

      // Mettre à jour ou créer le UserAchievement
      await UserAchievement.findOneAndUpdate(
        { user: userId, achievement: achievement._id },
        {
          progress,
          isUnlocked: isComplete,
          unlockedAt: isComplete ? new Date() : undefined,
        },
        { upsert: true, new: true }
      );

      // Si nouvellement débloqué, ajouter à la liste
      if (isComplete && !existing) {
        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  }

  // Initialiser les achievements par défaut
  async initializeDefaultAchievements() {
    const existingCount = await Achievement.countDocuments();
    if (existingCount > 0) {
      return; // Déjà initialisés
    }

    const defaultAchievements = [
      // Collection
      {
        name: 'Collectionneur débutant',
        description: 'Ajouter 10 jeux à votre collection',
        icon: '📚',
        category: 'collection',
        condition: { type: 'count', target: 'games', value: 10 },
        rarity: 'common',
        points: 10,
      },
      {
        name: 'Bibliothèque grandissante',
        description: 'Ajouter 50 jeux à votre collection',
        icon: '📖',
        category: 'collection',
        condition: { type: 'count', target: 'games', value: 50 },
        rarity: 'rare',
        points: 25,
      },
      {
        name: 'Véritable collection',
        description: 'Ajouter 100 jeux à votre collection',
        icon: '🏆',
        category: 'collection',
        condition: { type: 'count', target: 'games', value: 100 },
        rarity: 'epic',
        points: 50,
      },
      {
        name: 'Archiviste',
        description: 'Ajouter 500 jeux à votre collection',
        icon: '👑',
        category: 'collection',
        condition: { type: 'count', target: 'games', value: 500 },
        rarity: 'legendary',
        points: 100,
      },

      // Critiques
      {
        name: 'Première critique',
        description: 'Écrire votre première critique',
        icon: '✍️',
        category: 'review',
        condition: { type: 'count', target: 'reviews', value: 1 },
        rarity: 'common',
        points: 10,
      },
      {
        name: 'Critique en herbe',
        description: 'Écrire 10 critiques',
        icon: '📝',
        category: 'review',
        condition: { type: 'count', target: 'reviews', value: 10 },
        rarity: 'common',
        points: 15,
      },
      {
        name: 'Critique confirmé',
        description: 'Écrire 50 critiques',
        icon: '📰',
        category: 'review',
        condition: { type: 'count', target: 'reviews', value: 50 },
        rarity: 'rare',
        points: 30,
      },
      {
        name: 'Expert critique',
        description: 'Écrire 100 critiques',
        icon: '🎓',
        category: 'review',
        condition: { type: 'count', target: 'reviews', value: 100 },
        rarity: 'epic',
        points: 75,
      },
      {
        name: 'Critique détaillée',
        description: 'Écrire une critique de plus de 500 caractères',
        icon: '📜',
        category: 'review',
        condition: { type: 'count', target: 'reviews_long', value: 1 },
        rarity: 'rare',
        points: 20,
      },

      // Social
      {
        name: 'Sociable',
        description: 'Avoir 10 followers',
        icon: '👥',
        category: 'social',
        condition: { type: 'count', target: 'followers', value: 10 },
        rarity: 'common',
        points: 15,
      },
      {
        name: 'Influenceur',
        description: 'Avoir 50 followers',
        icon: '🌟',
        category: 'social',
        condition: { type: 'count', target: 'followers', value: 50 },
        rarity: 'rare',
        points: 35,
      },
      {
        name: 'Célèbre',
        description: 'Avoir 100 followers',
        icon: '💫',
        category: 'social',
        condition: { type: 'count', target: 'followers', value: 100 },
        rarity: 'epic',
        points: 60,
      },
      {
        name: 'Apprécié',
        description: 'Recevoir 100 likes sur vos critiques',
        icon: '❤️',
        category: 'social',
        condition: { type: 'count', target: 'likes_received', value: 100 },
        rarity: 'rare',
        points: 30,
      },
      {
        name: 'Commentateur actif',
        description: 'Poster 50 commentaires',
        icon: '💬',
        category: 'social',
        condition: { type: 'count', target: 'comments', value: 50 },
        rarity: 'rare',
        points: 25,
      },

      // Spéciaux
      {
        name: 'Fan ultime',
        description: 'Noter un jeu 5 étoiles',
        icon: '⭐',
        category: 'special',
        condition: { type: 'action', target: 'rating_5', value: 1 },
        rarity: 'common',
        points: 5,
      },
      {
        name: 'Critique sévère',
        description: 'Noter un jeu 1 étoile',
        icon: '💔',
        category: 'special',
        condition: { type: 'action', target: 'rating_1', value: 1 },
        rarity: 'common',
        points: 5,
      },
    ];

    await Achievement.insertMany(defaultAchievements);
  }

  // Récupérer les statistiques d'un utilisateur
  async getUserStats(userId: string) {
    const [totalAchievements, unlockedCount, totalPoints] = await Promise.all([
      Achievement.countDocuments(),
      UserAchievement.countDocuments({ user: userId, isUnlocked: true }),
      UserAchievement.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), isUnlocked: true } },
        {
          $lookup: {
            from: 'achievements',
            localField: 'achievement',
            foreignField: '_id',
            as: 'achievementData',
          },
        },
        { $unwind: '$achievementData' },
        { $group: { _id: null, total: { $sum: '$achievementData.points' } } },
      ]),
    ]);

    return {
      totalAchievements,
      unlockedCount,
      totalPoints: totalPoints[0]?.total || 0,
      completionRate: totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0,
    };
  }
}

export const achievementService = new AchievementService();
