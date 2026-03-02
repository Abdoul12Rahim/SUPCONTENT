import mongoose, { Document, Schema } from 'mongoose';

export interface ILike extends Document {
  user: mongoose.Types.ObjectId;
  review: mongoose.Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    review: { type: Schema.Types.ObjectId, ref: 'Review', required: true }
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, review: 1 }, { unique: true });

export default mongoose.model<ILike>('Like', likeSchema);
