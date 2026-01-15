export const FITNESS_GOALS = [
  'Weight Loss',
  'Muscle Gain',
  'General Fitness',
  'Endurance',
  'Flexibility',
  'Strength',
] as const;

export const USER_ROLES = ['Admin', 'Staff', 'Customer'] as const;

export const MEDIA_TYPES = ['document', 'video', 'audio'] as const;

export const MEDIA_CATEGORIES = [
  'Workouts',
  'Nutrition',
  'Mindset',
  'Recovery',
  'Supplements',
  'General',
] as const;

export const PROGRESS_STATUS = ['not-started', 'in-progress', 'completed'] as const;

export const TRANSACTION_STATUS = ['pending', 'completed', 'failed', 'refunded'] as const;

export const ORDER_STATUS = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export const SESSION_TYPES = ['group', 'one-on-one'] as const;

export const SESSION_STATUS = ['scheduled', 'in-progress', 'completed', 'cancelled'] as const;

// Navigation routes by role
export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  CUSTOMER: {
    DASHBOARD: '/customer/dashboard',
    CONTENT: '/customer/content',
    STORE: '/customer/store',
    CART: '/customer/cart',
    CHECKOUT: '/customer/checkout',
    ORDERS: '/customer/orders',
    SESSIONS: '/customer/sessions',
    PROFILE: '/customer/profile',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    CUSTOMERS: '/admin/customers',
    TRANSACTIONS: '/admin/transactions',
    CONTENT: '/admin/content',
    PRODUCTS: '/admin/products',
    REPORTS: '/admin/reports',
    SESSIONS: '/admin/sessions',
  },
  STAFF: {
    DASHBOARD: '/staff/dashboard',
    CONTENT: '/staff/content',
    CUSTOMERS: '/staff/customers',
    ANALYTICS: '/staff/analytics',
  },
  PUBLIC: {
    HOME: '/',
    ABOUT: '/about',
    CONTACT: '/contact',
  },
};

// API endpoints
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    SESSION: '/api/auth/session',
  },
  USERS: '/api/users',
  MEDIA: '/api/media',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  TRANSACTIONS: '/api/transactions',
  PROGRESS: '/api/progress',
  SESSIONS: '/api/sessions',
  STRIPE: {
    CHECKOUT: '/api/stripe/checkout',
    WEBHOOK: '/api/stripe/webhook',
  },
  UPLOADTHING: '/api/uploadthing',
  MUX: {
    WEBHOOK: '/api/mux/webhook',
  },
};

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// File upload limits
export const MAX_FILE_SIZE = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  VIDEO: 500 * 1024 * 1024, // 500MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  AUDIO: 50 * 1024 * 1024, // 50MB
};

// Validation
export const PASSWORD_MIN_LENGTH = 6;
export const USERNAME_MIN_LENGTH = 3;

// Session config
export const VIDEO_COMPLETION_THRESHOLD = 90; // 90% watched = completed
export const AUDIO_COMPLETION_THRESHOLD = 95; // 95% listened = completed
