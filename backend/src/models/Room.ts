import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  name: string;
  description?: string;
  avatar?: string;
  visibility: 'public' | 'private';
  rules?: string;
  creator: mongoose.Types.ObjectId;
  members: {
    user: mongoose.Types.ObjectId;
    role: 'admin' | 'moderator' | 'normal';
    joinedAt: Date;
  }[];
  pendingRequests: mongoose.Types.ObjectId[];
  bannedUsers: {
    user: mongoose.Types.ObjectId;
    bannedBy: mongoose.Types.ObjectId;
    bannedUntil?: Date | null; 
    reason?: string;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>({
  name: { type: String, required: true },
  description: { type: String },
  avatar: { type: String },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  rules: { type: String },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  members: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'moderator', 'normal'], default: 'normal' },
    joinedAt: { type: Date, default: Date.now }
  }],
  
  pendingRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  
  bannedUsers: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bannedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bannedUntil: { type: Date, default: null }, // null = banni à vie
    reason: { type: String }
  }],
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IRoom>('Room', roomSchema);