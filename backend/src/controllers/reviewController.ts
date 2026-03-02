import { Request, Response } from 'express';
import Review from '../models/Review';
import Content from '../models/Content';
import Like from '../models/Like';
import Comment from '../models/Comment';
import Activity from '../models/Activity';
import Follow from '../models/Follow';
import notificationService from '../services/notificationService';
import { achievementService } from '../services/achievementService';
import { io } from '../app';

export const createReview = async (req: Request, res: Response) => {
  try {
    const { contentId, rating, text, spoiler } = req.body;
    
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

    const review = await Review.create({
      user: req.user!._id,
      content: content._id,
      rating,
      text,
      spoiler: spoiler || false,
    });

    await Activity.create({
      user: req.user!._id,
      type: 'review',
      content: content._id,
      review: review._id,
      metadata: { rating },
    });

    // Émettre un événement pour rafraîchir le feed des followers
    const followers = await Follow.find({ following: req.user!._id }).select('follower');
    followers.forEach((follow) => {
      io.to(`user_${follow.follower}`).emit('new_activity');
    });

    // Vérifier les achievements
    const newAchievements = await achievementService.checkAndUnlockAchievements(req.user!._id.toString());
    if (newAchievements.length > 0) {
      newAchievements.forEach((achievement) => {
        io.to(`user_${req.user!._id}`).emit('achievement_unlocked', achievement);
      });
    }

    res.status(201).json(review);
  } catch (error: any) {
    // Gérer l'erreur de clé dupliquée (un utilisateur ne peut pas créer 2 avis pour le même jeu)
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: 'Vous avez déjà écrit un avis pour ce jeu. Vous pouvez le modifier depuis votre profil.',
        code: 'DUPLICATE_REVIEW'
      });
    }
    res.status(400).json({ message: error.message });
  }
};

export const getUserReviewForContent = async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const userId = req.user!._id;

    // Essayer de trouver le content par ID MongoDB ou externalId
    let content = await Content.findById(contentId).catch(() => null);
    
    if (!content) {
      // Essayer avec externalId si c'est un nombre
      if (!isNaN(parseInt(contentId))) {
        content = await Content.findOne({ externalId: parseInt(contentId) });
      }
    }
    
    if (!content) {
      return res.json({ hasReview: false, review: null });
    }

    const review = await Review.findOne({ user: userId, content: content._id })
      .populate('user', 'username displayName avatar');
    
    if (review) {
      return res.json({ hasReview: true, review });
    }
    
    return res.json({ hasReview: false, review: null });
  } catch (error: any) {
    console.error('Erreur getUserReviewForContent:', error);
    // En cas d'erreur, retourner false pour permettre la création
    return res.json({ hasReview: false, review: null });
  }
};

export const getReviewsByGame = async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Essayer de trouver le content par ID MongoDB ou externalId
    let content = await Content.findById(contentId).catch(() => null);
    
    if (!content) {
      content = await Content.findOne({ externalId: parseInt(contentId) });
    }
    
    if (!content) {
      return res.json({ items: [], total: 0, page: 1, totalPages: 0 });
    }

    const [reviews, total] = await Promise.all([
      Review.find({ content: content._id })
        .populate('user', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Review.countDocuments({ content: content._id }),
    ]);

    // Ajouter isLiked pour chaque review si l'utilisateur est connecté
    const reviewsWithLikes = await Promise.all(
      reviews.map(async (review) => {
        const reviewObj = review.toObject() as any;
        if (req.user) {
          const like = await Like.findOne({ user: req.user._id, review: review._id });
          reviewObj.isLiked = !!like;
        } else {
          reviewObj.isLiked = false;
        }
        return reviewObj;
      })
    );

    res.json({ items: reviewsWithLikes, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error: any) {
    console.error('Erreur getReviewsByGame:', error);
    res.status(500).json({ message: error.message });
  }
};

export const likeReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId).populate('content');
    if (!review) return res.status(404).json({ message: 'Critique non trouvée' });

    const existingLike = await Like.findOne({ user: req.user!._id, review: reviewId });
    if (existingLike) {
      await existingLike.deleteOne();
      review.likes = Math.max(0, review.likes - 1);
      await review.save();
      return res.json({ liked: false, likes: review.likes });
    }

    await Like.create({ user: req.user!._id, review: reviewId });
    review.likes += 1;
    await review.save();

    if (review.user.toString() !== req.user!._id.toString()) {
      await notificationService.notifyReviewLike(review.user.toString(), req.user!._id, reviewId);
      
      // Créer une activité pour le like
      await Activity.create({
        user: req.user!._id,
        type: 'like',
        content: review.content,
        review: reviewId,
        targetUser: review.user,
      });
      
      // Émettre un événement pour rafraîchir le feed des followers
      const followers = await Follow.find({ following: req.user!._id }).select('follower');
      followers.forEach((follow) => {
        io.to(`user_${follow.follower}`).emit('new_activity');
      });
    }

    // Vérifier les achievements
    const newAchievements = await achievementService.checkAndUnlockAchievements(req.user!._id.toString());
    if (newAchievements.length > 0) {
      newAchievements.forEach((achievement) => {
        io.to(`user_${req.user!._id}`).emit('achievement_unlocked', achievement);
      });
    }

    res.json({ liked: true, likes: review.likes });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { text, parentCommentId } = req.body;
    const review = await Review.findById(reviewId).populate('content');
    if (!review) return res.status(404).json({ message: 'Critique non trouvée' });

    // Si c'est une réponse, vérifier que le commentaire parent existe
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Commentaire parent non trouvé' });
      }
      if (parentComment.review.toString() !== reviewId) {
        return res.status(400).json({ message: 'Le commentaire parent n\'appartient pas à cette critique' });
      }
    }

    const comment = await Comment.create({ 
      user: req.user!._id, 
      review: reviewId, 
      text,
      parentComment: parentCommentId || null
    });
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username displayName avatar')
      .populate('parentComment');

    if (review.user.toString() !== req.user!._id.toString()) {
      await notificationService.notifyReviewComment(review.user.toString(), req.user!._id, reviewId);
      
      // Créer une activité pour le commentaire
      await Activity.create({
        user: req.user!._id,
        type: 'comment',
        content: review.content,
        review: reviewId,
        comment: comment._id,
        targetUser: review.user,
        metadata: { commentText: text.substring(0, 100) }, // Premier 100 caractères
      });
      
      // Émettre un événement pour rafraîchir le feed des followers
      const followers = await Follow.find({ following: req.user!._id }).select('follower');
      followers.forEach((follow) => {
        io.to(`user_${follow.follower}`).emit('new_activity');
      });
    }

    // Vérifier les achievements
    const newAchievements = await achievementService.checkAndUnlockAchievements(req.user!._id.toString());
    if (newAchievements.length > 0) {
      newAchievements.forEach((achievement) => {
        io.to(`user_${req.user!._id}`).emit('achievement_unlocked', achievement);
      });
    }

    res.status(201).json(populatedComment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    
    // Récupérer tous les commentaires de la critique
    const allComments = await Comment.find({ review: reviewId })
      .populate('user', 'username displayName avatar')
      .sort({ createdAt: 1 });
    
    // Organiser les commentaires en hiérarchie (commentaires principaux + réponses)
    const commentMap = new Map<string, any>();
    const topLevelComments: any[] = [];
    
    // Créer une map de tous les commentaires
    allComments.forEach((comment) => {
      const commentObj: any = comment.toObject();
      commentObj.replies = [];
      commentMap.set(commentObj._id.toString(), commentObj);
    });
    
    // Organiser en hiérarchie
    allComments.forEach((comment) => {
      const commentObj = commentMap.get(comment._id.toString());
      if (comment.parentComment) {
        // C'est une réponse, l'ajouter au commentaire parent
        const parent = commentMap.get(comment.parentComment.toString());
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        // C'est un commentaire de premier niveau
        topLevelComments.push(commentObj);
      }
    });
    
    res.json({ comments: topLevelComments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Commentaire non trouvé' });
    
    // Vérifier si l'utilisateur est le propriétaire du commentaire
    if (comment.user.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    comment.text = text;
    await comment.save();
    
    const updatedComment = await Comment.findById(comment._id).populate('user', 'username displayName avatar');
    res.json(updatedComment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Commentaire non trouvé' });
    
    // Vérifier si l'utilisateur est le propriétaire du commentaire
    if (comment.user.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    await comment.deleteOne();
    res.json({ message: 'Commentaire supprimé' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const reportReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const review = await Review.findByIdAndUpdate(reviewId, { isReported: true, reportReason: reason }, { new: true });
    if (!review) return res.status(404).json({ message: 'Critique non trouvée' });
    res.json({ message: 'Critique signalée' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getReviewById = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId)
      .populate('user', 'username displayName avatar')
      .populate('content', 'title slug backgroundImage externalId');
    
    if (!review) {
      return res.status(404).json({ message: 'Critique non trouvée' });
    }

    const reviewObj = review.toObject() as any;
    
    // Ajouter isLiked si l'utilisateur est connecté
    if (req.user) {
      const like = await Like.findOne({ user: req.user._id, review: reviewId });
      reviewObj.isLiked = !!like;
    } else {
      reviewObj.isLiked = false;
    }

    res.json(reviewObj);
  } catch (error: any) {
    console.error('Erreur getReviewById:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getRecentReviews = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [reviews, total] = await Promise.all([
      Review.find()
        .populate('user', 'username displayName avatar')
        .populate('content', 'title slug backgroundImage externalId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Review.countDocuments(),
    ]);

    res.json({ 
      reviews, 
      total, 
      page: parseInt(page as string), 
      totalPages: Math.ceil(total / parseInt(limit as string)) 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getReviewsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [reviews, total] = await Promise.all([
      Review.find({ user: userId })
        .populate('user', 'username displayName avatar')
        .populate('content', 'title slug backgroundImage externalId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Review.countDocuments({ user: userId }),
    ]);

    res.json({ 
      reviews, 
      total, 
      page: parseInt(page as string), 
      totalPages: Math.ceil(total / parseInt(limit as string)) 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
