import mongoose, { Document, Schema } from 'mongoose';

export interface IScheduledSession extends Document {
  title: string;
  description?: string;
  scheduledFor: Date;
  duration: number; // in minutes
  customerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: 'pending' | 'notified' | 'started' | 'completed' | 'cancelled';
  liveSessionId?: mongoose.Types.ObjectId;
  notificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledSessionSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      default: 60,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'notified', 'started', 'completed', 'cancelled'],
      default: 'pending',
    },
    liveSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveSession',
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ScheduledSession ||
  mongoose.model<IScheduledSession>('ScheduledSession', ScheduledSessionSchema);
