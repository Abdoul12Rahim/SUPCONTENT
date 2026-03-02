import mongoose, { Document, Schema } from 'mongoose';

export interface ILibrary extends Document {
  user: mongoose.Types.ObjectId;
  content: mongoose.Types.ObjectId;
  status: 'to_play' | 'playing' | 'completed' | 'dropped';
  rating?: number;
  hoursPlayed?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const librarySchema = new Schema<ILibrary>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: Schema.Types.ObjectId, ref: 'Content', required: true },
    status: {
      type: String,
      enum: ['to_play', 'playing', 'completed', 'dropped'],
      required: true,
    },
    rating: { type: Number, min: 1, max: 5 },
    hoursPlayed: { type: Number, min: 0 },
    notes: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

librarySchema.index({ user: 1, content: 1 }, { unique: true });
librarySchema.index({ user: 1, status: 1 });

export default mongoose.model<ILibrary>('Library', librarySchema);

