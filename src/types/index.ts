import { Types } from 'mongoose';

export type UserRole = 'Admin' | 'Staff' | 'Customer';

export type FitnessGoal =
  | 'Weight Loss'
  | 'Muscle Gain'
  | 'General Fitness'
  | 'Endurance'
  | 'Flexibility'
  | 'Strength';

export type MediaType = 'video' | 'pdf';

export type MediaCategory =
  | 'Workouts'
  | 'Nutrition'
  | 'Mindset'
  | 'Recovery'
  | 'Supplements'
  | 'General';

export type ProgressStatus = 'not-started' | 'in-progress' | 'completed';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod = 'card' | 'bank_transfer';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type SessionType = 'group' | 'one-on-one';

export type SessionStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface IUser {
  _id: Types.ObjectId;
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  fitnessGoal?: FitnessGoal;
  assignedStaff?: Types.ObjectId[];
  avatar?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedia {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  type: MediaType;
  category: MediaCategory;
  uploadedBy: Types.ObjectId;
  fileUrl: string;
  thumbnailUrl?: string;
  views: number;
  fileSize?: number;
  duration?: number;
  pages?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Alias for backward compatibility
export interface IContent extends IMedia {}

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  icon?: string;
  createdAt: Date;
}

export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: string[];
  stock: number;
  uploadedBy: Types.ObjectId;
  category?: string;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  productIds: Types.ObjectId[];
  amount: number;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProgress {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  contentId: Types.ObjectId;
  progress: number; // percentage 0-100
  status: ProgressStatus;
  lastWatchedPosition?: number; // in seconds for video/audio
  completedAt?: Date;
  streak: number;
  weeklySummary?: {
    week: number;
    year: number;
    hoursEngaged: number;
    itemsCompleted: number;
  };
  updatedAt: Date;
  createdAt: Date;
}

export interface IOrder {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  guestCustomer?: {
    fullName: string;
    email: string;
    phone: string;
  };
  products: {
    productId: Types.ObjectId;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: OrderStatus;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  type: SessionType;
  roomId: string;
  scheduledTime: Date;
  duration?: number; // in minutes
  status: SessionStatus;
  meetingLink?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Frontend-safe types (without sensitive data)
export type SafeUser = Omit<IUser, 'password'>;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalCustomers?: number;
  totalRevenue?: number;
  activeSubscriptions?: number;
  pendingOrders?: number;
  revenueToday?: number;
  revenueThisWeek?: number;
  revenueThisMonth?: number;
  contentViews?: number;
  completionRate?: number;
}

// Progress Summary
export interface ProgressSummary {
  totalContent: number;
  completedContent: number;
  inProgressContent: number;
  completionPercentage: number;
  currentStreak: number;
  weeklyHours: number;
  weeklyGoalsMet: number;
}
