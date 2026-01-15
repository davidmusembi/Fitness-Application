import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import LiveSession from '@/models/LiveSession';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { z } from 'zod';

const createLiveSessionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  customerIds: z.array(z.string()).min(1, 'At least one customer must be selected'),
  scheduledFor: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only admins can create live sessions.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, customerIds, scheduledFor } = createLiveSessionSchema.parse(body);

    await connectDB();

    // Verify all customers exist
    const customers = await User.find({
      _id: { $in: customerIds },
      role: 'Customer',
    });

    if (customers.length !== customerIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some customers are invalid' },
        { status: 400 }
      );
    }

    // Generate unique sessionId
    const sessionId = `live-${session.user.id}-${Date.now()}`;

    // Create live session
    const liveSession = await LiveSession.create({
      sessionId,
      title,
      description,
      adminId: session.user.id,
      invitedCustomers: customerIds,
      status: scheduledFor ? 'scheduled' : 'live',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      startedAt: scheduledFor ? undefined : new Date(),
    });

    // Populate customer details
    await liveSession.populate('invitedCustomers', 'fullName email username');

    // Create notifications for all invited customers
    const notificationPromises = customerIds.map((customerId) =>
      Notification.create({
        userId: customerId,
        type: 'call',
        title: 'Live Session Invitation',
        message: `${session.user.name} invited you to join "${title}"`,
        link: `/live-session/${sessionId}`,
        roomId: sessionId,
        read: false,
      })
    );

    await Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      data: liveSession,
      sessionUrl: `/live-session/${sessionId}`,
    });
  } catch (error: any) {
    console.error('Create live session error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create live session' },
      { status: 500 }
    );
  }
}
