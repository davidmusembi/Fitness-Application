import mongoose, { Schema, Model } from 'mongoose';
import { IProgress } from '@/types';

const ProgressSchema = new Schema<IProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started',
    },
    lastWatchedPosition: {
      type: Number, // in seconds
      default: 0,
    },
    completedAt: {
      type: Date,
    },
    streak: {
      type: Number,
      default: 0,
    },
    weeklySummary: {
      week: Number,
      year: Number,
      hoursEngaged: Number,
      itemsCompleted: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one progress per user per content
ProgressSchema.index({ userId: 1, contentId: 1 }, { unique: true });
ProgressSchema.index({ userId: 1, status: 1 });
ProgressSchema.index({ userId: 1, updatedAt: -1 });

// Delete the old cached model to ensure schema updates are applied
if (mongoose.models.Progress) {
  delete mongoose.models.Progress;
}

const Progress: Model<IProgress> = mongoose.model<IProgress>('Progress', ProgressSchema);

export default Progress;
