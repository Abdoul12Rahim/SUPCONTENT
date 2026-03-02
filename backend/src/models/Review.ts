import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  content: mongoose.Types.ObjectId;
  rating: number;
  text: string;
  spoiler: boolean;
  likes: number;
  isReported: boolean;
  reportReason?: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: Schema.Types.ObjectId, ref: 'Content', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, minlength: 3, maxlength: 5000 },
    spoiler: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    isReported: { type: Boolean, default: false },
    reportReason: { type: String },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, content: 1 }, { unique: true });
reviewSchema.index({ content: 1, createdAt: -1 });
reviewSchema.index({ isFeatured: 1 });

export default mongoose.model<IReview>('Review', reviewSchema);

