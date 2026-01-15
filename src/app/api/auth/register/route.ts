import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/utils/auth';
import { z } from 'zod';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fitnessGoal: z.enum([
    'Weight Loss',
    'Muscle Gain',
    'General Deeqdarajjo',
    'Endurance',
    'Flexibility',
    'Strength',
  ]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: validatedData.email },
        { username: validatedData.username },
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            existingUser.email === validatedData.email
              ? 'Email already registered'
              : 'Username already taken',
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create new user
    const user = await User.create({
      fullName: validatedData.fullName,
      username: validatedData.username,
      email: validatedData.email,
      password: hashedPassword,
      role: 'Customer',
      fitnessGoal: validatedData.fitnessGoal,
    });

    // Remove password from response
    const { password, ...safeUser } = user.toObject();

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        data: safeUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0].message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
