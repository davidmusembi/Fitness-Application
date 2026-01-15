import mongoose, { Schema, Model } from 'mongoose';

export interface ILiveSession {
  sessionId: string;
  title: string;
  description?: string;
  adminId: mongoose.Types.ObjectId;
  invitedCustomers: mongoose.Types.ObjectId[];
  joinedCustomers: mongoose.Types.ObjectId[];
  status: 'scheduled' | 'live' | 'ended';
  scheduledFor?: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

const LiveSessionSchema = new Schema<ILiveSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    invitedCustomers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    joinedCustomers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled',
      index: true,
    },
    scheduledFor: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

LiveSessionSchema.index({ adminId: 1, status: 1, createdAt: -1 });
LiveSessionSchema.index({ invitedCustomers: 1, status: 1 });

const LiveSession: Model<ILiveSession> =
  mongoose.models.LiveSession ||
  mongoose.model<ILiveSession>('LiveSession', LiveSessionSchema);

export default LiveSession;
