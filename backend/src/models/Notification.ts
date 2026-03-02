import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: 'follow' | 'like' | 'comment' | 'recommendation';
  from: mongoose.Types.ObjectId;
  reference?: mongoose.Types.ObjectId;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
      type: String, 
      enum: ['follow', 'like', 'comment', 'recommendation'],
      required: true 
    },
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reference: { type: Schema.Types.ObjectId },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', notificationSchema);
