import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import crypto from 'crypto';

// POST - Send password reset email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // For security, always return success even if email doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent',
      });
    }

    // Only allow customers to reset password
    // Staff and admin must contact an administrator
    if (user.role !== 'Customer') {
      return NextResponse.json({
        success: false,
        error: 'Password reset is only available for customer accounts. Please contact an administrator for assistance.',
      }, { status: 403 });
    }
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiry to 1 hour from now
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Save token to user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    // TODO: Send email using Email.js or your preferred email service
    // For now, we'll just log the URL (remove this in production)
    console.log('Password reset URL:', resetUrl);

    // In a real application, you would send an email here
    // Example with Email.js (requires email.js setup):
    /*
    import emailjs from '@emailjs/browser';

    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID!,
      process.env.EMAILJS_TEMPLATE_ID!,
      {
        to_email: email,
        to_name: user.fullName,
        reset_link: resetUrl,
      },
      process.env.EMAILJS_PUBLIC_KEY!
    );
    */

    // For now, return success (in production, send actual email)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent',
      // Remove this in production - only for development
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
