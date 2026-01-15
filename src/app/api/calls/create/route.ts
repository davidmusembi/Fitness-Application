import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import CallSession from '@/models/CallSession';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { z } from 'zod';

const createCallSchema = z.object({
  customerId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only admins can initiate calls.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { customerId } = createCallSchema.parse(body);

    await connectDB();

    // Verify customer exists
    const customer = await User.findById(customerId);
    if (!customer || customer.role !== 'Customer') {
      return NextResponse.json(
        { success: false, error: 'Invalid customer' },
        { status: 400 }
      );
    }

    // Generate unique roomId
    const roomId = `${session.user.id}-${customerId}-${Date.now()}`;

    // Create call session
    const callSession = await CallSession.create({
      roomId,
      adminId: session.user.id,
      customerId,
      status: 'pending',
    });

    // Populate user details
    await callSession.populate('customerId', 'fullName email username');

    // Create notification for customer
    await Notification.create({
      userId: customerId,
      type: 'call',
      title: 'Incoming Video Call',
      message: `${session.user.name} is inviting you to a video call`,
      link: `/call/${roomId}`,
      roomId,
      read: false,
    });

    return NextResponse.json({
      success: true,
      data: callSession,
      callUrl: `/call/${roomId}`,
    });
  } catch (error: any) {
    console.error('Create call error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create call session' },
      { status: 500 }
    );
  }
}
