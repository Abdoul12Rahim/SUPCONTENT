import User from '../models/User';
import Review from '../models/Review';
import Comment from '../models/Comment';
import Like from '../models/Like';
import mongoose from 'mongoose';

class AdminService {
  /**
   * Récupère les reviews signalées avec pagination
   */
  async getReportedReviews(page: number = 1, limit: number = 10, unresolved: boolean = true) {
    const skip = (page - 1) * limit;
    
    const query = unresolved ? { isReported: true } : { isReported: false };
    
    const reviews = await Review.find(query)
      .populate('user', 'username displayName avatar email')
      .populate('content', 'title slug backgroundImage')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(query);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Résout un signalement (supprime le flag signalé et optionnellement supprime la review)
   */
  async resolveReport(reviewId: string, deleteReview: boolean = false) {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      const error = new Error('ID de critique invalide');
      (error as any).statusCode = 400;
      throw error;
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      const error = new Error('Critique non trouvée');
      (error as any).statusCode = 404;
      throw error;
    }

    if (deleteReview) {
      // Supprimer la review et ses dépendances
      await Like.deleteMany({ review: reviewId });
      await Comment.deleteMany({ review: reviewId });
      await Review.findByIdAndDelete(reviewId);
      
      return {
        message: 'Critique supprimée',
        success: true,
      };
    } else {
      // Juste marquer comme non signalée
      await Review.findByIdAndUpdate(
        reviewId,
        { isReported: false, reportReason: null },
        { new: true }
      );

      return {
        message: 'Signalement résolu',
        success: true,
      };
    }
  }

  /**
   * Bannit un utilisateur
   */
  async banUser(userId: string, adminId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('ID utilisateur invalide');
      (error as any).statusCode = 400;
      throw error;
    }

    // Vérifier que l'admin n'essaie pas de se bannir lui-même
    if (userId === adminId.toString()) {
      const error = new Error('Vous ne pouvez pas vous bannir vous-même');
      (error as any).statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('Utilisateur non trouvé');
      (error as any).statusCode = 404;
      throw error;
    }

    if (user.isBanned) {
      const error = new Error('Cet utilisateur est déjà banni');
      (error as any).statusCode = 400;
      throw error;
    }

    await User.findByIdAndUpdate(
      userId,
      { isBanned: true },
      { new: true }
    );

    return {
      message: `Utilisateur ${user.username} a été banni`,
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isBanned: true,
      },
    };
  }

  /**
   * Débannit un utilisateur
   */
  async unbanUser(userId: string, adminId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('ID utilisateur invalide');
      (error as any).statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('Utilisateur non trouvé');
      (error as any).statusCode = 404;
      throw error;
    }

    if (!user.isBanned) {
      const error = new Error('Cet utilisateur n\'est pas banni');
      (error as any).statusCode = 400;
      throw error;
    }

    await User.findByIdAndUpdate(
      userId,
      { isBanned: false },
      { new: true }
    );

    return {
      message: `Utilisateur ${user.username} a été débanni`,
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isBanned: false,
      },
    };
  }

  /**
   * Marque une review comme à la une (featured)
   */
  async featureReview(reviewId: string) {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      const error = new Error('ID de critique invalide');
      (error as any).statusCode = 400;
      throw error;
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      const error = new Error('Critique non trouvée');
      (error as any).statusCode = 404;
      throw error;
    }

    if (review.isFeatured) {
      const error = new Error('Cette critique est déjà à la une');
      (error as any).statusCode = 400;
      throw error;
    }

    const updated = await Review.findByIdAndUpdate(
      reviewId,
      { isFeatured: true },
      { new: true }
    ).populate('user', 'username displayName avatar')
     .populate('content', 'title slug backgroundImage');

    return {
      message: 'Critique marquée comme à la une',
      success: true,
      review: updated,
    };
  }

  /**
   * Retire le statut "à la une" d'une review
   */
  async unfeatureReview(reviewId: string) {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      const error = new Error('ID de critique invalide');
      (error as any).statusCode = 400;
      throw error;
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      const error = new Error('Critique non trouvée');
      (error as any).statusCode = 404;
      throw error;
    }

    if (!review.isFeatured) {
      const error = new Error('Cette critique n\'est pas à la une');
      (error as any).statusCode = 400;
      throw error;
    }

    const updated = await Review.findByIdAndUpdate(
      reviewId,
      { isFeatured: false },
      { new: true }
    ).populate('user', 'username displayName avatar')
     .populate('content', 'title slug backgroundImage');

    return {
      message: 'Critique retirée de la une',
      success: true,
      review: updated,
    };
  }
}

export default new AdminService();
