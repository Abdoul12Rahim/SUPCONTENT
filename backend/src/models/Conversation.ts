import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

// Index pour rechercher les conversations d'un utilisateur rapidement
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

// Assurer qu'il n'y a que 2 participants
conversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    next(new Error('Une conversation doit avoir exactement 2 participants'));
  } else {
    next();
  }
});

export default mongoose.model<IConversation>('Conversation', conversationSchema);
