import mongoose, { Document, Schema } from 'mongoose';

export interface IList extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isPublic: boolean;
  items: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const listSchema = new Schema<IList>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, maxlength: 500 },
    isPublic: { type: Boolean, default: true },
    items: [{ type: Schema.Types.ObjectId, ref: 'Content' }]
  },
  { timestamps: true }
);

export default mongoose.model<IList>('List', listSchema);
