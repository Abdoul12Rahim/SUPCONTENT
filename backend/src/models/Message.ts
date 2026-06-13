import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  messageType: 'text' | 'voice';
  audioUrl?: string;
  audioMimeType?: string;
  audioDuration?: number;
  read: boolean;
  readBy?: { user: mongoose.Types.ObjectId; readAt: Date }[];
  likedBy?: { user: mongoose.Types.ObjectId; likedAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000 },
    messageType: { type: String, enum: ['text', 'voice'], default: 'text' },
    audioUrl: { type: String },
    audioMimeType: { type: String },
    audioDuration: { type: Number },
    read: { type: Boolean, default: false },
    readBy: {
      type: [
        {
          user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          readAt: { type: Date, required: true },
        },
      ],
      default: [],
    },
    likedBy: {
      type: [
        {
          user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          likedAt: { type: Date, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, read: 1 });
messageSchema.index({ conversation: 1, 'readBy.user': 1 });
messageSchema.index({ conversation: 1, 'likedBy.user': 1 });

export default mongoose.model<IMessage>('Message', messageSchema);
