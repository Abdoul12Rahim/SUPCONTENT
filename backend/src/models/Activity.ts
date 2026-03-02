import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  user: mongoose.Types.ObjectId;
  type: 'review' | 'library_add' | 'list_create' | 'list_add' | 'follow' | 'like' | 'comment';
  content?: mongoose.Types.ObjectId;
  review?: mongoose.Types.ObjectId;
  list?: mongoose.Types.ObjectId;
  targetUser?: mongoose.Types.ObjectId;
  comment?: mongoose.Types.ObjectId;
  metadata?: {
    rating?: number;
    status?: string;
    listName?: string;
    commentText?: string;
    [key: string]: any;
  };
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['review', 'library_add', 'list_create', 'list_add', 'follow', 'like', 'comment'],
      required: true,
    },
    content: { type: Schema.Types.ObjectId, ref: 'Content' },
    review: { type: Schema.Types.ObjectId, ref: 'Review' },
    list: { type: Schema.Types.ObjectId, ref: 'List' },
    targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
    comment: { type: Schema.Types.ObjectId, ref: 'Comment' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

export default mongoose.model<IActivity>('Activity', activitySchema);
