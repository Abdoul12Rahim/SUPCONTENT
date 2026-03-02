import mongoose, { Document, Schema } from 'mongoose';

export interface IContent extends Document {
  externalId: number; // ID from RAWG API
  slug: string; // URL-friendly identifier
  title: string;
  description: string;
  released?: string; // Release date
  backgroundImage?: string;
  metacritic?: number;
  rating?: number; // RAWG rating
  ratingsCount?: number;
  playtime?: number; // Average playtime in hours
  genres: string[];
  platforms: string[];
  developers: string[];
  publishers: string[];
  esrbRating?: string;
  website?: string;
  // Local data (SUPCONTENT)
  averageUserRating: number;
  totalUserRatings: number;
  totalReviews: number;
  cachedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contentSchema = new Schema<IContent>(
  {
    externalId: { type: Number, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    released: { type: String },
    backgroundImage: { type: String },
    metacritic: { type: Number },
    rating: { type: Number },
    ratingsCount: { type: Number },
    playtime: { type: Number },
    genres: [{ type: String }],
    platforms: [{ type: String }],
    developers: [{ type: String }],
    publishers: [{ type: String }],
    esrbRating: { type: String },
    website: { type: String },
    // Local data
    averageUserRating: { type: Number, default: 0 },
    totalUserRatings: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    cachedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index pour les recherches
contentSchema.index({ title: 'text', description: 'text' });
contentSchema.index({ externalId: 1 });
contentSchema.index({ slug: 1 });
contentSchema.index({ genres: 1 });
contentSchema.index({ released: -1 });

export default mongoose.model<IContent>('Content', contentSchema);

