import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IContent extends Document {
  _id: string;
  title: string;
  description?: string;
  type: 'video' | 'pdf';
  category: string;
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  updatedAt: Date;
  views: number;
  fileSize?: number;
  duration?: number; // For videos (in seconds)
  pages?: number; // For PDFs
}

const ContentSchema = new Schema<IContent>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['video', 'pdf'],
        message: '{VALUE} is not a valid content type',
      },
      required: [true, 'Content type is required'],
    },
    category: {
      type: String,
      enum: {
        values: ['Workouts', 'Nutrition', 'Mindset', 'Recovery', 'Supplements', 'General'],
        message: '{VALUE} is not a valid category',
      },
      required: [true, 'Category is required'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    thumbnailUrl: {
      type: String,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    fileSize: {
      type: Number,
      min: 0,
    },
    duration: {
      type: Number,
      min: 0,
    },
    pages: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ContentSchema.index({ category: 1 });
ContentSchema.index({ type: 1 });
ContentSchema.index({ uploadedBy: 1 });
ContentSchema.index({ createdAt: -1 });
ContentSchema.index({ title: 'text', description: 'text' }); // Full-text search

const Content: Model<IContent> =
  mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);

export default Content;
