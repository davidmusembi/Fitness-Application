import mongoose, { Schema, Model } from 'mongoose';
import { ISession } from '@/types';

const SessionSchema = new Schema<ISession>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    type: {
      type: String,
      enum: ['group', 'one-on-one'],
      required: true,
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    meetingLink: {
      type: String,
    },
    notes: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SessionSchema.index({ roomId: 1 });
SessionSchema.index({ scheduledTime: 1 });
SessionSchema.index({ status: 1 });
SessionSchema.index({ participants: 1 });

const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

export default Session;
