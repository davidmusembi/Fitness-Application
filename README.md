# 🏋️ Fitness Platform - DeeqDarajjo

A comprehensive fitness platform that combines e-commerce, content management, and live coaching features. This Next.js application allows customers to purchase supplements, access educational fitness content (videos and PDFs), track their fitness progress, and participate in live training sessions with coaches.

![MIT License](https://img.shields.io/badge/License-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green)

## ✨ Features

### 🛒 **E-Commerce**
- Browse and purchase fitness supplements and products
- Shopping cart functionality
- Secure payment processing via Stripe
- Order tracking and history
- Product inventory management

### 📚 **Content Library**
- Access educational fitness content (videos and PDFs)
- Content categories: Workouts, Nutrition, Mindset, Recovery, Supplements
- Video streaming with custom player
- PDF viewer for educational materials
- Progress tracking for consumed content

### 👥 **Role-Based Access**
- **Admin**: Full platform management, content upload, product management
- **Staff**: Customer management, content creation, live session hosting
- **Customer**: Access content, purchase products, join live sessions

### 🎥 **Live Training Sessions**
- Real-time video sessions with trainers
- WebRTC-based video calls
- Screen sharing capabilities
- Session scheduling and management
- Customer invitations and attendance tracking

### 📊 **Progress Tracking**
- Personal fitness goal setting (Weight Loss, Muscle Gain, General Fitness, etc.)
- Progress monitoring and analytics
- Workout history
- Performance metrics

### 🔐 **Authentication & Security**
- Secure user authentication with NextAuth.js
- JWT-based session management
- Password encryption with bcrypt
- Role-based access control

## 🚀 Tech Stack

### **Frontend**
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Video Player**: Vidstack
- **PDF Viewer**: react-pdf
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Hooks

### **Backend**
- **Runtime**: Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js v4
- **API**: Next.js API Routes
- **File Processing**: FFmpeg for video processing
- **Real-time**: Socket.io

### **Payment & Services**
- **Payments**: Stripe
- **Email**: Resend
- **Video Calls**: PeerJS + Simple Peer (WebRTC)
- **Caching**: Upstash Redis (optional)
- **Rate Limiting**: Upstash Rate Limit

### **Development Tools**
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Package Manager**: npm

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git**

Optional services (for full functionality):
- Stripe account (for payments)
- Resend account (for email)
- Upstash account (for Redis caching)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/davidmusembi/Fitness-Application.git
   cd Fitness-Application
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure the following required variables:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/fitness-platform
   
   # Authentication
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-super-secret-nextauth-key
   JWT_SECRET=your-super-secret-jwt-key
   
   # Application
   NODE_ENV=development
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   
   For production, also configure:
   - Stripe keys (payment processing)
   - Resend API key (email notifications)
   - Additional optional services as needed

4. **Generate secure secrets** (recommended)
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # Generate JWT_SECRET
   openssl rand -base64 32
   ```

## 🎯 Usage

### Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## 📁 Project Structure

```
Fitness-Application/
├── public/                    # Static assets
│   ├── uploads/              # User uploaded files
│   └── ...                   # Images and other static files
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── admin/           # Admin dashboard pages
│   │   ├── api/             # API routes
│   │   ├── auth/            # Authentication pages
│   │   ├── customer/        # Customer dashboard
│   │   ├── shop/            # E-commerce pages
│   │   ├── staff/           # Staff dashboard
│   │   └── live-session/    # Live training sessions
│   ├── components/          # Reusable React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   ├── models/              # MongoDB/Mongoose models
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── Content.ts
│   │   ├── Order.ts
│   │   ├── LiveSession.ts
│   │   └── ...
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Helper functions
│   └── middleware.ts        # Next.js middleware
├── .env.example             # Environment variables template
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.js
```

## 🔑 Key Features Explained

### Content Management
- Admins and staff can upload fitness content (videos up to 10GB, PDFs)
- Content is categorized for easy discovery
- Full-text search across content titles and descriptions
- View tracking and analytics

### E-Commerce
- Product catalog with images and descriptions
- Stock management
- Shopping cart with persistent state
- Stripe integration for secure payments
- Order management and history

### Live Sessions
- Real-time video conferencing using WebRTC
- Multiple participants support
- Session scheduling with customer invitations
- Session recording capabilities (optional)
- Screen sharing for demonstrations

### User Roles & Permissions
- **Admin**: Complete system access, user management, content approval
- **Staff**: Content creation, customer coaching, live session hosting
- **Customer**: Content consumption, product purchases, session participation

## 🛣️ API Routes

Key API endpoints include:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - List all products
- `GET /api/products/[id]` - Get product details
- `POST /api/admin/products` - Create product (Admin)
- `PUT /api/admin/products/[id]` - Update product (Admin)
- `DELETE /api/admin/products/[id]` - Delete product (Admin)

### Content
- `GET /api/content` - List all content
- `GET /api/content/[id]` - Get content details
- `POST /api/staff/content` - Upload content (Staff/Admin)
- `DELETE /api/staff/content/[id]` - Delete content (Staff/Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/customer/orders` - Get user orders
- `GET /api/admin/orders` - Get all orders (Admin)

### Live Sessions
- `POST /api/live-sessions` - Create session (Staff/Admin)
- `GET /api/live-sessions` - List sessions
- `POST /api/live-sessions/[id]/join` - Join session

## 🔒 Security Features

- **Password Hashing**: bcrypt encryption
- **JWT Tokens**: Secure session management
- **CORS Protection**: Configured origin restrictions
- **Input Validation**: Zod schema validation
- **Rate Limiting**: Upstash rate limiting (optional)
- **SQL Injection Prevention**: Mongoose parameterized queries
- **XSS Protection**: React's built-in protections

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Write meaningful commit messages
- Update documentation for any new features
- Test your changes thoroughly before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 David Musembi

## 👨‍💻 Author

**David Musembi**

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Video player by [Vidstack](https://www.vidstack.io/)
- Icons from [Lucide React](https://lucide.dev/)

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Note**: This is a comprehensive fitness platform designed for professional fitness coaching businesses. Make sure to properly configure all environment variables and services before deploying to production.
