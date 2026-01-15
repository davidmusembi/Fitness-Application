import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { comparePassword } from '@/utils/auth';

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('NextAuth: Missing credentials');
          throw new Error('Email and password are required');
        }

        try {
          await connectDB();

          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            console.error('NextAuth: User not found for email:', credentials.email);
            throw new Error('Invalid email or password');
          }

          const isValidPassword = await comparePassword(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            console.error('NextAuth: Invalid password for user:', credentials.email);
            throw new Error('Invalid email or password');
          }

          console.log('NextAuth: User authenticated successfully:', user.email, 'Role:', user.role);

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName,
            username: user.username,
            role: user.role as string,
            fitnessGoal: user.fitnessGoal,
            avatar: user.avatar,
          };
        } catch (error: any) {
          console.error('NextAuth: Authorization error:', error.message);
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          console.log('NextAuth JWT Callback - User:', JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role
          }));
          token.id = user.id;
          token.username = user.username ?? null;
          token.fitnessGoal = user.fitnessGoal || "";
          token.avatar = user.avatar || "";

          // Assign role from user object (came from DB in authorize)
          token.role = user.role || 'Customer';
          console.log('NextAuth JWT Callback - Token role set to:', token.role);
        }
        console.log('NextAuth JWT Callback - Final token role:', token.role);
        return token;
      } catch (error) {
        console.error('NextAuth JWT Callback error:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        console.log('NextAuth Session Callback - Token role:', token.role);
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = (token.role as string) || 'Customer'; // Ensure role is string, default to Customer
          session.user.username = token.username || "";
          session.user.fitnessGoal = token.fitnessGoal || "";
          session.user.avatar = token.avatar || "";
          console.log('NextAuth Session Callback - Session role set to:', session.user.role);
        }
        console.log('NextAuth Session Callback - Final session user role:', session.user?.role);
        return session;
      } catch (error) {
        console.error('NextAuth Session Callback error:', error);
        return session;
      }
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
