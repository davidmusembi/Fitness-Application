import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import CallSession from '@/models/CallSession';

interface RouteParams {
  params: Promise<{
    roomId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { roomId } = await params;
    const callSession = await CallSession.findOne({ roomId })
      .populate('adminId', 'fullName email username')
      .populate('customerId', 'fullName email username');

    if (!callSession) {
      return NextResponse.json(
        { success: false, error: 'Call session not found' },
        { status: 404 }
      );
    }

    // Verify user is part of the call
    const isParticipant =
      callSession.adminId._id.toString() === session.user.id ||
      callSession.customerId._id.toString() === session.user.id;

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to access this call' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: callSession,
    });
  } catch (error: any) {
    console.error('Fetch call error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch call session' },
      { status: 500 }
    );
  }
}

// Update call status to active
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { roomId } = await params;
    const callSession = await CallSession.findOne({ roomId });

    if (!callSession) {
      return NextResponse.json(
        { success: false, error: 'Call session not found' },
        { status: 404 }
      );
    }

    // Update to active if pending
    if (callSession.status === 'pending') {
      callSession.status = 'active';
      callSession.startedAt = new Date();
      await callSession.save();
    }

    return NextResponse.json({
      success: true,
      data: callSession,
    });
  } catch (error: any) {
    console.error('Update call error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update call session' },
      { status: 500 }
    );
  }
}
