import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  user: mongoose.Types.ObjectId;
  review: mongoose.Types.ObjectId;
  text: string;
  parentComment?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    review: { type: Schema.Types.ObjectId, ref: 'Review', required: true },
    text: { type: String, required: true, maxlength: 500 },
    parentComment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null }
  },
  { timestamps: true }
);

export default mongoose.model<IComment>('Comment', commentSchema);
