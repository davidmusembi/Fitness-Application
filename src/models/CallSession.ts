import mongoose, { Schema, Model } from 'mongoose';

export interface ICallSession {
  roomId: string;
  adminId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  status: 'pending' | 'active' | 'ended' | 'missed';
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

const CallSessionSchema = new Schema<ICallSession>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'ended', 'missed'],
      default: 'pending',
      index: true,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying user's call history
CallSessionSchema.index({ adminId: 1, createdAt: -1 });
CallSessionSchema.index({ customerId: 1, createdAt: -1 });

const CallSession: Model<ICallSession> =
  mongoose.models.CallSession || mongoose.model<ICallSession>('CallSession', CallSessionSchema);

export default CallSession;
