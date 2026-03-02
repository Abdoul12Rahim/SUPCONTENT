import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

// Fonction pour générer un code d'invitation unique
const generateInviteCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 caractères (ex: A3F5C7B2)
};

export interface ICollaborativeList extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: Array<{
    user: mongoose.Types.ObjectId;
    role: 'owner' | 'editor' | 'viewer';
    addedAt: Date;
  }>;
  items: Array<{
    content: mongoose.Types.ObjectId;
    addedBy: mongoose.Types.ObjectId;
    addedAt: Date;
    note?: string;
  }>;
  visibility: 'public' | 'private';
  inviteCode: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const collaborativeListSchema = new Schema<ICollaborativeList>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'editor', 'viewer'],
          default: 'viewer',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    items: [
      {
        content: {
          type: Schema.Types.ObjectId,
          ref: 'Content',
          required: true,
        },
        addedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          maxlength: 200,
        },
      },
    ],
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      default: generateInviteCode,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index pour rechercher les listes d'un utilisateur
collaborativeListSchema.index({ 'members.user': 1 });

// Index pour rechercher les listes publiques
collaborativeListSchema.index({ visibility: 1 });

export default mongoose.model<ICollaborativeList>('CollaborativeList', collaborativeListSchema);
