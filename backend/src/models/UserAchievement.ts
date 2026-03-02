import mongoose, { Schema, Document } from 'mongoose';

export interface IUserAchievement extends Document {
  user: mongoose.Types.ObjectId;
  achievement: mongoose.Types.ObjectId;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserAchievementSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    achievement: {
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    isUnlocked: {
      type: Boolean,
      default: false,
    },
    unlockedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index pour éviter les doublons
UserAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });

// Index pour les requêtes fréquentes
UserAchievementSchema.index({ user: 1, isUnlocked: 1 });

export const UserAchievement = mongoose.model<IUserAchievement>(
  'UserAchievement',
  UserAchievementSchema
);
