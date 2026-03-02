import Follow from '../models/Follow';
import Activity from '../models/Activity';
import User from '../models/User';
import Review from '../models/Review';
import notificationService from './notificationService';
import { io } from '../app';
import mongoose from 'mongoose';

export class SocialService {
  /**
   * Suivre un utilisateur
   */
  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('Vous ne pouvez pas vous suivre vous-même');
    }

    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId,
    });

    if (existingFollow) {
      throw new Error('Vous suivez déjà cet utilisateur');
    }

    await Follow.create({ follower: followerId, following: followingId });

    // Créer une activité
    await Activity.create({
      user: followerId,
      type: 'follow',
      targetUser: followingId,
    });

    // Notifier l'utilisateur suivi
    await notificationService.notifyNewFollower(followingId, followerId);

    // Émettre un événement pour rafraîchir le feed des followers
    const followers = await Follow.find({ following: followerId }).select('follower');
    followers.forEach((follow) => {
      io.to(`user_${follow.follower}`).emit('new_activity');
    });
  }

  /**
   * Ne plus suivre un utilisateur
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const result = await Follow.findOneAndDelete({
      follower: followerId,
      following: followingId,
    });

    if (!result) {
      throw new Error('Vous ne suivez pas cet utilisateur');
    }
  }

  /**
   * Vérifie si un utilisateur en suit un autre
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await Follow.findOne({
      follower: followerId,
      following: followingId,
    });
    return !!follow;
  }

  /**
   * Récupère les followers d'un utilisateur
   */
  async getFollowers(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      Follow.find({ following: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('follower', 'username displayName avatar bio')
        .lean(),
      Follow.countDocuments({ following: userId }),
    ]);

    return {
      followers: follows.map((f: any) => f.follower),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Récupère les utilisateurs suivis
   */
  async getFollowing(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      Follow.find({ follower: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('following', 'username displayName avatar bio')
        .lean(),
      Follow.countDocuments({ follower: userId }),
    ]);

    return {
      following: follows.map((f: any) => f.following),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Récupère le fil d'actualité d'un utilisateur
   */
  async getFeed(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    const skip = (page - 1) * limit;

    // Récupérer les IDs des utilisateurs suivis
    const following = await Follow.find({ follower: userId }).select('following');
    const followingIds = following.map((f: any) => f.following);

    // Récupérer les activités des utilisateurs suivis
    const [activities, total] = await Promise.all([
      Activity.find({ user: { $in: followingIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username displayName avatar')
        .populate('content', 'title slug backgroundImage externalId')
        .populate('review')
        .populate('list', 'name')
        .populate('targetUser', 'username displayName avatar')
        .populate('comment')
        .lean(),
      Activity.countDocuments({ user: { $in: followingIds } }),
    ]);

    return {
      activities,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Récupère le nombre de followers et following
   */
  async getUserStats(userId: string): Promise<{ followers: number; following: number }> {
    const [followers, following] = await Promise.all([
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId }),
    ]);

    return { followers, following };
  }

  /**
   * Recherche des utilisateurs
   */
  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 20,
    currentUserId?: string
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      {
        $match: {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { displayName: { $regex: query, $options: 'i' } },
          ],
          isBanned: false,
        },
      },
      {
        $lookup: {
          from: 'follows',
          localField: '_id',
          foreignField: 'following',
          as: 'followers',
        },
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'user',
          as: 'reviews',
        },
      },
    ];

    // Si l'utilisateur est connecté, vérifier le statut de suivi
    if (currentUserId) {
      pipeline.push({
        $lookup: {
          from: 'follows',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$following', '$$userId'] },
                    { $eq: ['$follower', new mongoose.Types.ObjectId(currentUserId)] }
                  ]
                }
              }
            }
          ],
          as: 'currentUserFollow'
        }
      });
    }

    pipeline.push(
      {
        $addFields: {
          followersCount: { $size: '$followers' },
          reviewCount: { $size: '$reviews' },
          isFollowing: currentUserId ? { $gt: [{ $size: '$currentUserFollow' }, 0] } : { $literal: false },
        },
      },
      {
        $project: {
          username: 1,
          displayName: 1,
          avatar: 1,
          bio: 1,
          stats: {
            followersCount: '$followersCount',
            reviewCount: '$reviewCount',
          },
          isFollowing: 1,
        },
      },
      { $skip: skip },
      { $limit: limit }
    );

    const users = await User.aggregate(pipeline);
    return users;
  }

  /**
   * Obtenir des suggestions d'utilisateurs à suivre
   */
  async getUserSuggestions(currentUserId: string, limit: number = 12): Promise<any[]> {
    // Récupérer les IDs des utilisateurs déjà suivis
    const following = await Follow.find({ follower: currentUserId }).select('following');
    const followingIds = following.map((f: any) => f.following.toString());
    
    // Exclure l'utilisateur actuel et ceux qu'il suit déjà
    const excludedIds = [...followingIds, currentUserId].map(id => new mongoose.Types.ObjectId(id));

    // Récupérer les utilisateurs avec leurs stats
    const users = await User.aggregate([
      {
        $match: {
          _id: { $nin: excludedIds },
          isBanned: false,
        },
      },
      {
        $lookup: {
          from: 'follows',
          localField: '_id',
          foreignField: 'following',
          as: 'followers',
        },
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'user',
          as: 'reviews',
        },
      },
      {
        $addFields: {
          followersCount: { $size: '$followers' },
          reviewCount: { $size: '$reviews' },
          // Score basé sur followers et reviews
          score: {
            $add: [
              { $multiply: [{ $size: '$followers' }, 2] },
              { $size: '$reviews' },
            ],
          },
        },
      },
      {
        $sort: { score: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          username: 1,
          displayName: 1,
          avatar: 1,
          bio: 1,
          stats: {
            followersCount: '$followersCount',
            reviewCount: '$reviewCount',
          },
          // Toujours false puisqu'on a exclus ceux qu'on suit déjà
          isFollowing: { $literal: false },
        },
      },
    ]);

    return users;
  }
}

export default new SocialService();
