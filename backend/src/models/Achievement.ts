import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  name: string;
  description: string;
  icon: string; // Emoji ou nom d'icône
  category: 'collection' | 'review' | 'social' | 'special';
  condition: {
    type: 'count' | 'milestone' | 'action';
    target: string; // 'games', 'reviews', 'followers', 'likes'
    value: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isSecret: boolean;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['collection', 'review', 'social', 'special'],
      required: true,
    },
    condition: {
      type: {
        type: String,
        enum: ['count', 'milestone', 'action'],
        required: true,
      },
      target: {
        type: String,
        required: true,
      },
      value: {
        type: Number,
        required: true,
      },
    },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true }
);

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema);
